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

package model

// DeploymentStatus is the lifecycle state of a deployment.
type DeploymentStatus string

const (
	DeploymentStatusDraft            DeploymentStatus = "draft"
	DeploymentStatusPendingApproval  DeploymentStatus = "pending_approval"
	DeploymentStatusRejected         DeploymentStatus = "rejected"
	DeploymentStatusApproved         DeploymentStatus = "approved"
	DeploymentStatusRunning          DeploymentStatus = "running"
	DeploymentStatusSuccess          DeploymentStatus = "success"
	DeploymentStatusFailed           DeploymentStatus = "failed"
	DeploymentStatusCancelled        DeploymentStatus = "cancelled"
)

// TargetStatus is the per-node status within a deployment.
type TargetStatus string

const (
	TargetStatusQueued     TargetStatus = "queued"
	TargetStatusDeploying  TargetStatus = "deploying"
	TargetStatusHealthCheck TargetStatus = "health_check"
	TargetStatusHealthy    TargetStatus = "healthy"
	TargetStatusFailed     TargetStatus = "failed"
	TargetStatusSkipped    TargetStatus = "skipped"
	TargetStatusRolledBack TargetStatus = "rolled_back"
)

// DeploymentLog is a single log entry of a deployment.
type DeploymentLog struct {
	At      int64  `json:"at"`
	Level   string `json:"level"` // info | success | warning | danger
	Message string `json:"message"`
}

// Deployment is the top-level rollout object.
type Deployment struct {
	ID                int64           `json:"id" xorm:"pk autoincr 'id'"`
	Created           int64           `json:"created" xorm:"created"`
	Updated           int64           `json:"updated" xorm:"updated"`
	OrgID             int64           `json:"org_id" xorm:"INDEX 'org_id'"`
	ApplicationID     int64           `json:"application_id" xorm:"INDEX 'application_id'"`
	EnvironmentID     int64           `json:"environment_id" xorm:"INDEX 'environment_id'"`
	ReleaseID         int64           `json:"release_id" xorm:"INDEX 'release_id'"`
	PreviousReleaseID int64           `json:"previous_release_id"`
	PipelineID        int64           `json:"pipeline_id"`
	GroupID           int64           `json:"group_id"`
	Status            DeploymentStatus `json:"status" xorm:"VARCHAR(24)"`
	Strategy          DeployStrategy  `json:"strategy" xorm:"VARCHAR(16)"`
	BatchSize         int             `json:"batch_size"`
	Progress          int             `json:"progress"`
	TriggeredBy       string          `json:"triggered_by" xorm:"VARCHAR(64)"`
	ApprovedBy        string          `json:"approved_by" xorm:"VARCHAR(64)"`
	ApprovedAt        int64           `json:"approved_at"`
	StartedAt         int64           `json:"started_at"`
	FinishedAt        int64           `json:"finished_at"`
	RollbackOf        int64           `json:"rollback_of"`
	RolledBackTo      int64           `json:"rolled_back_to"`
	Logs              []DeploymentLog `json:"logs" xorm:"JSON 'logs'"`
} //	@name	Deployment

func (Deployment) TableName() string {
	return "ops_deployments"
}

// DeploymentTarget is the per-node state of a deployment (composite PK).
type DeploymentTarget struct {
	DeploymentID int64        `json:"deployment_id" xorm:"pk 'deployment_id'"`
	ServerID     int64        `json:"server_id" xorm:"pk 'server_id'"`
	Status       TargetStatus `json:"status" xorm:"VARCHAR(16)"`
	Phase        string       `json:"phase" xorm:"VARCHAR(16)"` // waiting | pulling | starting | health_check | healthy
	Message      string       `json:"message" xorm:"VARCHAR(255)"`
	Attempts     int          `json:"attempts"`
	StartedAt    int64        `json:"started_at"`
	FinishedAt   int64        `json:"finished_at"`
} //	@name	DeploymentTarget

func (DeploymentTarget) TableName() string {
	return "ops_deployment_targets"
}

// Approval records one approval/rejection for a deployment.
type Approval struct {
	ID           int64  `json:"id" xorm:"pk autoincr 'id'"`
	Created      int64  `json:"created" xorm:"created"`
	OrgID        int64  `json:"org_id" xorm:"INDEX 'org_id'"`
	DeploymentID int64  `json:"deployment_id" xorm:"INDEX 'deployment_id'"`
	Approver     string `json:"approver" xorm:"VARCHAR(64)"`
	Approved     bool   `json:"approved"`
	Comment      string `json:"comment" xorm:"VARCHAR(255)"`
} //	@name	Approval

func (Approval) TableName() string {
	return "ops_approvals"
}
