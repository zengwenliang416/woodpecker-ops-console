// Copyright 2026 Woodpecker Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package ops

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"go.woodpecker-ci.org/woodpecker/v3/server/model"
	"go.woodpecker-ci.org/woodpecker/v3/server/pubsub"
	"go.woodpecker-ci.org/woodpecker/v3/server/store"
)

// Topics published on the pubsub bus for the control plane.
const (
	TopicDeploymentProgress = "deployment.progress"
	TopicDeploymentLogs     = "deployment.logs"
	TopicAlertCreated       = "alert.created"
	TopicServerUpdated      = "server.updated"
)

// Executor performs the actual rollout actions (Mock in phase 2, Node Agent in phase 3).
type Executor interface {
	Deploy(ctx context.Context, target model.DeploymentTarget, release model.AppRelease, app model.Application, server model.Server) error
	HealthCheck(ctx context.Context, server model.Server, app model.Application) error
}

// Engine orchestrates the deployment state machine, approvals, batching and rollbacks.
type Engine struct {
	store    store.Store
	pubsub   pubsub.PubSub
	executor Executor

	mu         sync.Mutex
	deployLock map[int64]bool // application_id -> deploying (deployment lock)
}

// NewEngine creates the deployment orchestration engine.
func NewEngine(s store.Store, ps pubsub.PubSub, executor Executor) *Engine {
	return &Engine{
		store:      s,
		pubsub:     ps,
		executor:   executor,
		deployLock: make(map[int64]bool),
	}
}

func (e *Engine) publish(ctx context.Context, topic string, data any) {
	raw, err := json.Marshal(data)
	if err != nil {
		return
	}
	_ = e.pubsub.Publish(ctx, pubsub.Topics{topic: {}}, pubsub.Message{Data: raw})
}

func (e *Engine) addLog(ctx context.Context, deployment *model.Deployment, level, message string) {
	deployment.Logs = append(deployment.Logs, model.DeploymentLog{At: time.Now().Unix(), Level: level, Message: message})
	if err := e.store.DeploymentUpdate(deployment); err == nil {
		e.publish(ctx, fmt.Sprintf("%s.%d", TopicDeploymentLogs, deployment.ID), message)
	}
}

// CreateDeployment creates a deployment from a release targeting a server group.
// When the environment requires approval the deployment enters pending_approval,
// otherwise it starts immediately.
func (e *Engine) CreateDeployment(ctx context.Context, app *model.Application, env *model.Environment, release *model.AppRelease, group *model.ServerGroup, strategy model.DeployStrategy, batchSize int, triggeredBy string) (*model.Deployment, error) {
	e.mu.Lock()
	if e.deployLock[app.ID] {
		e.mu.Unlock()
		return nil, fmt.Errorf("an active deployment is already running for application %q", app.Name)
	}
	e.deployLock[app.ID] = true
	e.mu.Unlock()

	servers, err := e.store.ServerListByGroup(group.ID)
	if err != nil {
		e.mu.Lock()
		delete(e.deployLock, app.ID)
		e.mu.Unlock()
		return nil, err
	}

	deployment := &model.Deployment{
		OrgID:             app.OrgID,
		ApplicationID:     app.ID,
		EnvironmentID:     env.ID,
		ReleaseID:         release.ID,
		PreviousReleaseID: 0,
		PipelineID:        release.PipelineID,
		GroupID:           group.ID,
		Strategy:          strategy,
		BatchSize:         batchSize,
		TriggeredBy:       triggeredBy,
		Status:            model.DeploymentStatusDraft,
	}
	if err := e.store.DeploymentCreate(deployment); err != nil {
		e.mu.Lock()
		delete(e.deployLock, app.ID)
		e.mu.Unlock()
		return nil, err
	}

	for _, server := range servers {
		if err := e.store.DeploymentTargetUpsert(&model.DeploymentTarget{
			DeploymentID: deployment.ID,
			ServerID:     server.ID,
			Status:       model.TargetStatusQueued,
			Phase:        "waiting",
		}); err != nil {
			e.mu.Lock()
			delete(e.deployLock, app.ID)
			e.mu.Unlock()
			return nil, err
		}
	}

	e.addLog(ctx, deployment, "info", fmt.Sprintf("Deployment created by %s targeting release %s", triggeredBy, release.Version))

	if env.ApprovalRequired {
		deployment.Status = model.DeploymentStatusPendingApproval
		if err := e.store.DeploymentUpdate(deployment); err != nil {
			return nil, err
		}
		e.addLog(ctx, deployment, "warning", fmt.Sprintf("Awaiting %d approval(s) for %s", env.MinimumApprovers, env.Name))
	} else {
		if err := e.StartDeployment(ctx, deployment.ID); err != nil {
			return nil, err
		}
		deployment.Status = model.DeploymentStatusRunning
	}

	e.publish(ctx, fmt.Sprintf("%s.%d", TopicDeploymentProgress, deployment.ID), deployment.Status)
	return deployment, nil
}

// StartDeployment transitions an approved (or approval-free) deployment into running.
func (e *Engine) StartDeployment(ctx context.Context, deploymentID int64) error {
	deployment, err := e.store.DeploymentGet(deploymentID)
	if err != nil {
		return err
	}

	deployment.Status = model.DeploymentStatusRunning
	deployment.StartedAt = time.Now().Unix()
	if err := e.store.DeploymentUpdate(deployment); err != nil {
		return err
	}
	e.addLog(ctx, deployment, "info", "Deployment started")

	go e.schedule(ctx, deployment)
	return nil
}

// Approve registers an approval; once the minimum is reached the deployment starts.
func (e *Engine) Approve(ctx context.Context, deploymentID int64, approver, comment string, minimumApprovers int) error {
	deployment, err := e.store.DeploymentGet(deploymentID)
	if err != nil {
		return err
	}
	if deployment.Status != model.DeploymentStatusPendingApproval {
		return fmt.Errorf("deployment %d is not awaiting approval", deploymentID)
	}

	if err := e.store.ApprovalCreate(&model.Approval{
		OrgID:        deployment.OrgID,
		DeploymentID: deploymentID,
		Approver:     approver,
		Approved:     true,
		Comment:      comment,
	}); err != nil {
		return err
	}

	approvals, err := e.store.ApprovalListByDeployment(deploymentID)
	if err != nil {
		return err
	}

	e.addLog(ctx, deployment, "success", fmt.Sprintf("Approved by %s (%d/%d)", approver, len(approvals), minimumApprovers))
	if len(approvals) >= minimumApprovers {
		deployment.Status = model.DeploymentStatusApproved
		deployment.ApprovedBy = approver
		deployment.ApprovedAt = time.Now().Unix()
		if err := e.store.DeploymentUpdate(deployment); err != nil {
			return err
		}
		e.publish(ctx, fmt.Sprintf("%s.%d", TopicDeploymentProgress, deployment.ID), deployment.Status)
		return e.StartDeployment(ctx, deploymentID)
	}
	e.publish(ctx, fmt.Sprintf("%s.%d", TopicDeploymentProgress, deployment.ID), deployment.Status)
	return nil
}

// Reject rejects a pending deployment.
func (e *Engine) Reject(ctx context.Context, deploymentID int64, approver, comment string) error {
	deployment, err := e.store.DeploymentGet(deploymentID)
	if err != nil {
		return err
	}
	if deployment.Status != model.DeploymentStatusPendingApproval {
		return fmt.Errorf("deployment %d is not awaiting approval", deploymentID)
	}

	if err := e.store.ApprovalCreate(&model.Approval{
		OrgID:        deployment.OrgID,
		DeploymentID: deploymentID,
		Approver:     approver,
		Approved:     false,
		Comment:      comment,
	}); err != nil {
		return err
	}

	deployment.Status = model.DeploymentStatusRejected
	if err := e.store.DeploymentUpdate(deployment); err != nil {
		return err
	}
	e.addLog(ctx, deployment, "danger", fmt.Sprintf("Rejected by %s: %s", approver, comment))
	e.releaseLock(deployment.ApplicationID)
	e.publish(ctx, fmt.Sprintf("%s.%d", TopicDeploymentProgress, deployment.ID), deployment.Status)
	return nil
}

// Pause / Resume / Cancel are lifecycle controls for running deployments.
func (e *Engine) Pause(ctx context.Context, deploymentID int64) error {
	return e.transition(ctx, deploymentID, model.DeploymentStatusRunning, func(d *model.Deployment) {
		d.Status = model.DeploymentStatusPaused
	})
}

func (e *Engine) Resume(ctx context.Context, deploymentID int64) error {
	return e.transition(ctx, deploymentID, model.DeploymentStatusPaused, func(d *model.Deployment) {
		d.Status = model.DeploymentStatusRunning
	})
}

func (e *Engine) Cancel(ctx context.Context, deploymentID int64) error {
	deployment, err := e.store.DeploymentGet(deploymentID)
	if err != nil {
		return err
	}
	if deployment.Status != model.DeploymentStatusRunning && deployment.Status != model.DeploymentStatusPaused {
		return fmt.Errorf("deployment %d cannot be cancelled in status %s", deploymentID, deployment.Status)
	}
	deployment.Status = model.DeploymentStatusCancelled
	deployment.FinishedAt = time.Now().Unix()
	if err := e.store.DeploymentUpdate(deployment); err != nil {
		return err
	}
	e.addLog(ctx, deployment, "warning", "Deployment cancelled")
	e.releaseLock(deployment.ApplicationID)
	e.publish(ctx, fmt.Sprintf("%s.%d", TopicDeploymentProgress, deployment.ID), deployment.Status)
	return nil
}

// Retry resets failed targets to queued and resumes scheduling.
func (e *Engine) Retry(ctx context.Context, deploymentID int64, serverIDs []int64) error {
	deployment, err := e.store.DeploymentGet(deploymentID)
	if err != nil {
		return err
	}
	if deployment.Status != model.DeploymentStatusFailed && deployment.Status != model.DeploymentStatusRunning {
		return fmt.Errorf("deployment %d cannot retry in status %s", deploymentID, deployment.Status)
	}
	for _, serverID := range serverIDs {
		if err := e.store.DeploymentTargetUpsert(&model.DeploymentTarget{
			DeploymentID: deploymentID,
			ServerID:     serverID,
			Status:       model.TargetStatusQueued,
			Phase:        "waiting",
		}); err != nil {
			return err
		}
	}
	if deployment.Status == model.DeploymentStatusFailed {
		deployment.Status = model.DeploymentStatusRunning
		if err := e.store.DeploymentUpdate(deployment); err != nil {
			return err
		}
	}
	e.addLog(ctx, deployment, "info", fmt.Sprintf("Retrying %d failed node(s)", len(serverIDs)))
	go e.schedule(ctx, deployment)
	return nil
}

// Rollback creates a rollback deployment pointing at the previous release.
func (e *Engine) Rollback(ctx context.Context, deploymentID int64, triggeredBy string) (*model.Deployment, error) {
	source, err := e.store.DeploymentGet(deploymentID)
	if err != nil {
		return nil, err
	}
	if source.PreviousReleaseID == 0 {
		return nil, fmt.Errorf("deployment %d has no previous release to roll back to", deploymentID)
	}
	env, err := e.store.EnvironmentGet(source.EnvironmentID)
	if err != nil {
		return nil, err
	}
	prev, err := e.store.AppReleaseGet(source.PreviousReleaseID)
	if err != nil {
		return nil, err
	}

	rollback := &model.Deployment{
		OrgID:             source.OrgID,
		ApplicationID:     source.ApplicationID,
		EnvironmentID:     source.EnvironmentID,
		ReleaseID:         prev.ID,
		PreviousReleaseID: source.ReleaseID,
		PipelineID:        prev.PipelineID,
		GroupID:           source.GroupID,
		Strategy:          model.DeployStrategyRolling,
		BatchSize:         1,
		TriggeredBy:       triggeredBy,
		Status:            model.DeploymentStatusDraft,
		RollbackOf:        source.ID,
	}
	if err := e.store.DeploymentCreate(rollback); err != nil {
		return nil, err
	}

	targets, err := e.store.DeploymentTargetList(source.ID)
	if err != nil {
		return nil, err
	}
	for _, t := range targets {
		if err := e.store.DeploymentTargetUpsert(&model.DeploymentTarget{
			DeploymentID: rollback.ID,
			ServerID:     t.ServerID,
			Status:       model.TargetStatusQueued,
			Phase:        "waiting",
		}); err != nil {
			return nil, err
		}
	}

	// Mark the source deployment as rolled back.
	source.RolledBackTo = rollback.ID
	source.Status = model.DeploymentStatusCancelled
	if err := e.store.DeploymentUpdate(source); err != nil {
		return nil, err
	}

	e.addLog(ctx, rollback, "warning", fmt.Sprintf("Rollback created by %s targeting %s", triggeredBy, prev.Version))
	env.ApprovalRequired = false // rollbacks skip approval gates by design
	return rollback, e.StartDeployment(ctx, rollback.ID)
}

// Advance manually starts the next batch for rolling deployments.
func (e *Engine) Advance(ctx context.Context, deploymentID int64) error {
	deployment, err := e.store.DeploymentGet(deploymentID)
	if err != nil {
		return err
	}
	if deployment.Status != model.DeploymentStatusRunning {
		return fmt.Errorf("deployment %d is not running", deploymentID)
	}
	go e.schedule(ctx, deployment)
	return nil
}

// ---------------------------------------------------------------------------
// internals

func (e *Engine) transition(ctx context.Context, deploymentID int64, from model.DeploymentStatus, mutate func(*model.Deployment)) error {
	deployment, err := e.store.DeploymentGet(deploymentID)
	if err != nil {
		return err
	}
	if deployment.Status != from {
		return fmt.Errorf("deployment %d is not in status %s (got %s)", deploymentID, from, deployment.Status)
	}
	mutate(deployment)
	if err := e.store.DeploymentUpdate(deployment); err != nil {
		return err
	}
	e.addLog(ctx, deployment, "info", fmt.Sprintf("Deployment status changed to %s", deployment.Status))
	e.publish(ctx, fmt.Sprintf("%s.%d", TopicDeploymentProgress, deployment.ID), deployment.Status)
	return nil
}

func (e *Engine) releaseLock(applicationID int64) {
	e.mu.Lock()
	delete(e.deployLock, applicationID)
	e.mu.Unlock()
}

// schedule drives batch execution until all targets are terminal.
func (e *Engine) schedule(ctx context.Context, deployment *model.Deployment) {
	for {
		targets, err := e.store.DeploymentTargetList(deployment.ID)
		if err != nil {
			return
		}

		// Determine the current batch.
		queued := make([]*model.DeploymentTarget, 0)
		running := 0
		failed := 0
		healthy := 0
		for i := range targets {
			switch targets[i].Status {
			case model.TargetStatusQueued:
				queued = append(queued, targets[i])
			case model.TargetStatusDeploying, model.TargetStatusHealthCheck:
				running++
			case model.TargetStatusFailed:
				failed++
			case model.TargetStatusHealthy:
				healthy++
			}
		}

		if running > 0 {
			time.Sleep(1 * time.Second)
			continue
		}

		// A batch finished: handle terminal conditions.
		if failed > 0 {
			e.handleFailure(ctx, deployment)
			return
		}
		if len(queued) == 0 {
			e.finish(ctx, deployment)
			return
		}

		// Launch the next batch.
		batchSize := deployment.BatchSize
		if batchSize <= 0 || deployment.Strategy == model.DeployStrategySingle {
			batchSize = 1
		}
		if deployment.Strategy == model.DeployStrategyAllAtOnce {
			batchSize = len(queued)
		}
		if batchSize > len(queued) {
			batchSize = len(queued)
		}

		for _, target := range queued[:batchSize] {
			go e.runTarget(ctx, deployment, target)
		}
		time.Sleep(1 * time.Second)
	}
}

func (e *Engine) runTarget(ctx context.Context, deployment *model.Deployment, target *model.DeploymentTarget) {
	target.Status = model.TargetStatusDeploying
	target.Phase = "pulling"
	target.StartedAt = time.Now().Unix()
	if err := e.store.DeploymentTargetUpsert(target); err != nil {
		return
	}
	e.publish(ctx, fmt.Sprintf("%s.%d", TopicDeploymentProgress, deployment.ID), deployment.Status)

	release, err := e.store.AppReleaseGet(deployment.ReleaseID)
	if err != nil {
		target.Status = model.TargetStatusFailed
		target.Message = err.Error()
		_ = e.store.DeploymentTargetUpsert(target)
		return
	}
	app, err := e.store.ApplicationGet(deployment.ApplicationID)
	if err != nil {
		target.Status = model.TargetStatusFailed
		target.Message = err.Error()
		_ = e.store.DeploymentTargetUpsert(target)
		return
	}
	server, err := e.store.ServerGet(target.ServerID)
	if err != nil {
		target.Status = model.TargetStatusFailed
		target.Message = err.Error()
		_ = e.store.DeploymentTargetUpsert(target)
		return
	}

	// Preflight: skip offline/maintenance servers, warn on high disk.
	if server.Status == model.ServerStatusMaintenance || server.Maintenance {
		target.Status = model.TargetStatusSkipped
		target.Message = "server in maintenance mode"
		_ = e.store.DeploymentTargetUpsert(target)
		e.addLog(ctx, deployment, "warning", fmt.Sprintf("%s: skipped (maintenance)", server.Name))
		return
	}
	if server.Status == model.ServerStatusOffline {
		target.Status = model.TargetStatusSkipped
		target.Message = "server offline"
		_ = e.store.DeploymentTargetUpsert(target)
		e.addLog(ctx, deployment, "warning", fmt.Sprintf("%s: skipped (offline)", server.Name))
		return
	}

	e.addLog(ctx, deployment, "info", fmt.Sprintf("%s: deploying %s (%s)", server.Name, release.Version, release.Digest))
	if err := e.executor.Deploy(ctx, *target, *release, *app, *server); err != nil {
		target.Status = model.TargetStatusFailed
		target.Phase = "failed"
		target.Message = err.Error()
		target.FinishedAt = time.Now().Unix()
		_ = e.store.DeploymentTargetUpsert(target)
		e.addLog(ctx, deployment, "danger", fmt.Sprintf("%s: deploy failed: %v", server.Name, err))
		return
	}

	target.Status = model.TargetStatusHealthCheck
	target.Phase = "health_check"
	if err := e.store.DeploymentTargetUpsert(target); err != nil {
		return
	}
	if err := e.executor.HealthCheck(ctx, *server, *app); err != nil {
		target.Status = model.TargetStatusFailed
		target.Phase = "failed"
		target.Message = err.Error()
		target.FinishedAt = time.Now().Unix()
		_ = e.store.DeploymentTargetUpsert(target)
		e.addLog(ctx, deployment, "danger", fmt.Sprintf("%s: health check failed: %v", server.Name, err))
		return
	}

	target.Status = model.TargetStatusHealthy
	target.Phase = "healthy"
	target.FinishedAt = time.Now().Unix()
	target.Message = "Health check passed"
	if err := e.store.DeploymentTargetUpsert(target); err != nil {
		return
	}
	e.addLog(ctx, deployment, "success", fmt.Sprintf("%s: healthy", server.Name))
}

func (e *Engine) finish(ctx context.Context, deployment *model.Deployment) {
	deployment.Status = model.DeploymentStatusSuccess
	deployment.Progress = 100
	deployment.FinishedAt = time.Now().Unix()
	if err := e.store.DeploymentUpdate(deployment); err != nil {
		return
	}
	e.addLog(ctx, deployment, "success", "Deployment completed")
	e.releaseLock(deployment.ApplicationID)

	// Mark the release as deployed.
	if release, err := e.store.AppReleaseGet(deployment.ReleaseID); err == nil {
		release.Status = model.AppReleaseStatusDeployed
		_ = e.store.AppReleaseUpdate(release)
	}
	e.publish(ctx, fmt.Sprintf("%s.%d", TopicDeploymentProgress, deployment.ID), deployment.Status)
}

func (e *Engine) handleFailure(ctx context.Context, deployment *model.Deployment) {
	deployment.Status = model.DeploymentStatusFailed
	deployment.FinishedAt = time.Now().Unix()
	if err := e.store.DeploymentUpdate(deployment); err != nil {
		return
	}
	e.addLog(ctx, deployment, "danger", "Deployment failed")
	e.releaseLock(deployment.ApplicationID)

	// Auto rollback when the environment enables it.
	if env, err := e.store.EnvironmentGet(deployment.EnvironmentID); err == nil && env.AutoRollback && deployment.PreviousReleaseID != 0 {
		e.addLog(ctx, deployment, "warning", "Auto rollback enabled, creating rollback deployment")
		if _, err := e.Rollback(ctx, deployment.ID, "auto-rollback"); err != nil {
			e.addLog(ctx, deployment, "danger", fmt.Sprintf("Auto rollback failed: %v", err))
		}
	}
	e.publish(ctx, fmt.Sprintf("%s.%d", TopicDeploymentProgress, deployment.ID), deployment.Status)
}
