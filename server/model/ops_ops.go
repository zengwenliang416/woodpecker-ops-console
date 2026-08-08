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

// AlertStatus is the lifecycle state of an alert.
type AlertStatus string

const (
	AlertStatusActive       AlertStatus = "active"
	AlertStatusAcknowledged AlertStatus = "acknowledged"
	AlertStatusResolved     AlertStatus = "resolved"
)

// Alert is a monitoring notification linked to servers and deployments.
type Alert struct {
	ID             int64       `json:"id" xorm:"pk autoincr 'id'"`
	Created        int64       `json:"created" xorm:"created"`
	Updated        int64       `json:"updated" xorm:"updated"`
	OrgID          int64       `json:"org_id" xorm:"INDEX 'org_id'"`
	Type           string      `json:"type" xorm:"VARCHAR(32)"` // cpu | memory | disk | container_restart | server_offline | deployment_failed
	Severity       string      `json:"severity" xorm:"VARCHAR(16)"`
	Status         AlertStatus `json:"status" xorm:"VARCHAR(16)"`
	ServerID       int64       `json:"server_id" xorm:"INDEX 'server_id'"`
	DeploymentID   int64       `json:"deployment_id"`
	Message        string      `json:"message" xorm:"VARCHAR(255)"`
	AcknowledgedBy string      `json:"acknowledged_by" xorm:"VARCHAR(64)"`
	ResolvedBy     string      `json:"resolved_by" xorm:"VARCHAR(64)"`
	ResolvedAt     int64       `json:"resolved_at"`
} //	@name	Alert

func (Alert) TableName() string {
	return "ops_alerts"
}

// AuditLog is an append-only record of privileged operations.
type AuditLog struct {
	ID           int64  `json:"id" xorm:"pk autoincr 'id'"`
	Created      int64  `json:"created" xorm:"created"`
	OrgID        int64  `json:"org_id" xorm:"INDEX 'org_id'"`
	Actor        string `json:"actor" xorm:"VARCHAR(64)"`
	Action       string `json:"action" xorm:"VARCHAR(64)"`
	ResourceType string `json:"resource_type" xorm:"VARCHAR(32)"`
	ResourceID   int64  `json:"resource_id"`
	Detail       string `json:"detail" xorm:"VARCHAR(512)"`
	IP           string `json:"ip" xorm:"VARCHAR(64)"`
} //	@name	AuditLog

func (AuditLog) TableName() string {
	return "ops_audit_logs"
}

// NodeTaskStatus is the lifecycle of a signed task dispatched to a Node Agent.
type NodeTaskStatus string

const (
	NodeTaskStatusPending NodeTaskStatus = "pending"
	NodeTaskStatusRunning NodeTaskStatus = "running"
	NodeTaskStatusSuccess NodeTaskStatus = "success"
	NodeTaskStatusFailed  NodeTaskStatus = "failed"
)

// NodeTask is a signed, whitelisted action dispatched to a Node Agent.
type NodeTask struct {
	ID           int64          `json:"id" xorm:"pk autoincr 'id'"`
	Created      int64          `json:"created" xorm:"created"`
	Updated      int64          `json:"updated" xorm:"updated"`
	ServerID     int64          `json:"server_id" xorm:"INDEX 'server_id'"`
	Type         string         `json:"type" xorm:"VARCHAR(16)"` // deploy | restart | maintenance | cert_revoke
	Payload      string         `json:"payload" xorm:"TEXT"`
	Signature    string         `json:"signature" xorm:"TEXT"`
	Status       NodeTaskStatus `json:"status" xorm:"VARCHAR(16)"`
	Result       string         `json:"result" xorm:"TEXT"`
	DeploymentID int64          `json:"deployment_id"`
} //	@name	NodeTask

func (NodeTask) TableName() string {
	return "ops_node_tasks"
}
