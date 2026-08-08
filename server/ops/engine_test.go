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
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"go.woodpecker-ci.org/woodpecker/v3/server/model"
	"go.woodpecker-ci.org/woodpecker/v3/server/pubsub"
	"go.woodpecker-ci.org/woodpecker/v3/server/store"
	"go.woodpecker-ci.org/woodpecker/v3/server/store/datastore"
)

func newTestEngine(t *testing.T) (*Engine, store.Store) {
	t.Helper()

	s, err := datastore.NewEngine(&store.Opts{Driver: "sqlite3", Config: filepath.Join(t.TempDir(), "test.db"), XORM: store.XORM{MaxOpenConns: 1, MaxIdleConns: 1}})
	assert.NoError(t, err)

	ctx := context.Background()
	assert.NoError(t, s.Migrate(ctx, false))

	// Seed minimal entities.
	app := &model.Application{OrgID: 1, RepoID: 101, Name: "backend-api", Image: "ghcr.io/acme/backend-api", Runtime: "docker-compose", Service: "api", HealthPath: "/health/ready", Port: 8080}
	assert.NoError(t, s.ApplicationCreate(app))

	env := &model.Environment{OrgID: 1, Name: "staging", Title: "Staging"}
	assert.NoError(t, s.EnvironmentCreate(env))

	group := &model.ServerGroup{OrgID: 1, EnvironmentID: env.ID, Name: "staging-shared", Strategy: model.DeployStrategyRolling, BatchSize: 1, HealthPath: "/health", Port: 8080}
	assert.NoError(t, s.ServerGroupCreate(group))

	for i, name := range []string{"node-a", "node-b"} {
		server := &model.Server{OrgID: 1, GroupID: group.ID, EnvironmentID: env.ID, Name: name, Status: model.ServerStatusOnline, Health: model.ServerHealthHealthy, PrivateIP: "10.0.0.1", Runtime: "docker"}
		_ = i
		assert.NoError(t, s.ServerCreate(server))
	}

	release := &model.AppRelease{OrgID: 1, ApplicationID: app.ID, PipelineID: 1, Version: "v1.0.0", Digest: "sha256:abc", Image: "ghcr.io/acme/backend-api", Status: model.AppReleaseStatusReady}
	assert.NoError(t, s.AppReleaseCreate(release))

	mockExecutor := NewMockExecutor()
	mockExecutor.DeployDuration = 10 * time.Millisecond
	mockExecutor.HealthCheckDuration = 5 * time.Millisecond
	mockExecutor.FailureRate = 0

	engine := NewEngine(s, &pubsubMock{}, mockExecutor)
	return engine, s
}

// pubsubMock records published messages without wiring a real bus.
type pubsubMock struct{}

func (p *pubsubMock) Publish(_ context.Context, _ pubsub.Topics, _ pubsub.Message) error { return nil }

func (p *pubsubMock) Subscribe(_ context.Context, _ pubsub.Topics, _ pubsub.Receiver) error { return nil }

func TestDeploymentHappyPath(t *testing.T) {
	engine, s := newTestEngine(t)
	ctx := context.Background()

	app, _ := s.ApplicationGet(1)
	env, _ := s.EnvironmentGet(1)
	group, _ := s.ServerGroupGet(1)
	release, _ := s.AppReleaseGet(1)

	dep, err := engine.CreateDeployment(ctx, app, env, release, group, model.DeployStrategyRolling, 1, "alice")
	assert.NoError(t, err)
	assert.Equal(t, model.DeploymentStatusRunning, dep.Status)

	assert.Eventually(t, func() bool {
		got, err := s.DeploymentGet(dep.ID)
		return err == nil && got.Status == model.DeploymentStatusSuccess
	}, 10*time.Second, 50*time.Millisecond)

	got, err := s.DeploymentGet(dep.ID)
	assert.NoError(t, err)
	assert.Equal(t, 100, got.Progress)
	assert.Len(t, got.Logs, 7) // created + started + 2x (deploy + healthy) + completed

	targets, err := s.DeploymentTargetList(dep.ID)
	assert.NoError(t, err)
	assert.Len(t, targets, 2)
	for _, target := range targets {
		assert.Equal(t, model.TargetStatusHealthy, target.Status)
	}

	// Release should be marked deployed.
	rel, _ := s.AppReleaseGet(release.ID)
	assert.Equal(t, model.AppReleaseStatusDeployed, rel.Status)
}

func TestDeploymentApprovalFlow(t *testing.T) {
	engine, s := newTestEngine(t)
	ctx := context.Background()

	app, _ := s.ApplicationGet(1)
	env, _ := s.EnvironmentGet(1)
	env.ApprovalRequired = true
	env.MinimumApprovers = 1
	assert.NoError(t, s.EnvironmentUpdate(env))
	group, _ := s.ServerGroupGet(1)
	release, _ := s.AppReleaseGet(1)

	dep, err := engine.CreateDeployment(ctx, app, env, release, group, model.DeployStrategyAllAtOnce, 1, "alice")
	assert.NoError(t, err)
	assert.Equal(t, model.DeploymentStatusPendingApproval, dep.Status)

	// Deployment must not start before approval.
	time.Sleep(150 * time.Millisecond)
	got, _ := s.DeploymentGet(dep.ID)
	assert.Equal(t, model.DeploymentStatusPendingApproval, got.Status)

	assert.NoError(t, engine.Approve(ctx, dep.ID, "mike", "LGTM", 1))
	assert.Eventually(t, func() bool {
		got, err := s.DeploymentGet(dep.ID)
		return err == nil && got.Status == model.DeploymentStatusSuccess
	}, 10*time.Second, 50*time.Millisecond)
}

func TestDeploymentReject(t *testing.T) {
	engine, s := newTestEngine(t)
	ctx := context.Background()

	app, _ := s.ApplicationGet(1)
	env, _ := s.EnvironmentGet(1)
	env.ApprovalRequired = true
	assert.NoError(t, s.EnvironmentUpdate(env))
	group, _ := s.ServerGroupGet(1)
	release, _ := s.AppReleaseGet(1)

	dep, err := engine.CreateDeployment(ctx, app, env, release, group, model.DeployStrategyRolling, 1, "alice")
	assert.NoError(t, err)
	assert.NoError(t, engine.Reject(ctx, dep.ID, "mike", "blocked"))

	got, _ := s.DeploymentGet(dep.ID)
	assert.Equal(t, model.DeploymentStatusRejected, got.Status)

	// Lock must be released so a new deployment can be created.
	dep2, err := engine.CreateDeployment(ctx, app, env, release, group, model.DeployStrategyRolling, 1, "bob")
	assert.NoError(t, err)
	assert.NotNil(t, dep2)
}
