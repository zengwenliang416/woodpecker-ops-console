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

// ServerStatus is the lifecycle state of a node server.
type ServerStatus string

const (
	ServerStatusOnline      ServerStatus = "online"
	ServerStatusOffline     ServerStatus = "offline"
	ServerStatusMaintenance ServerStatus = "maintenance"
)

// ServerHealth is the health level reported by the node agent.
type ServerHealth string

const (
	ServerHealthHealthy  ServerHealth = "healthy"
	ServerHealthWarning  ServerHealth = "warning"
	ServerHealthCritical ServerHealth = "critical"
	ServerHealthMaintenance ServerHealth = "maintenance"
)

// MetricsSnapshot holds the most recent metric samples (12 points, aligned with the prototype).
type MetricsSnapshot struct {
	CPU     []float64 `json:"cpu"`
	Memory  []float64 `json:"memory"`
	Disk    []float64 `json:"disk"`
	Network []float64 `json:"network"`
}

// Server is a node server registered through a Node Agent.
type Server struct {
	ID               int64             `json:"id" xorm:"pk autoincr 'id'"`
	Created          int64             `json:"created" xorm:"created"`
	Updated          int64             `json:"updated" xorm:"updated"`
	OrgID            int64             `json:"org_id" xorm:"INDEX 'org_id'"`
	GroupID          int64             `json:"group_id" xorm:"INDEX 'group_id'"`
	EnvironmentID    int64             `json:"environment_id" xorm:"INDEX 'environment_id'"`
	Name             string            `json:"name" xorm:"UNIQUE 'name'"`
	Region           string            `json:"region" xorm:"VARCHAR(64)"`
	Zone             string            `json:"zone" xorm:"VARCHAR(64)"`
	PrivateIP        string            `json:"private_ip" xorm:"VARCHAR(64)"`
	PublicIP         string            `json:"public_ip" xorm:"VARCHAR(64)"`
	OS               string            `json:"os" xorm:"VARCHAR(100)"`
	Kernel           string            `json:"kernel" xorm:"VARCHAR(100)"`
	Runtime          string            `json:"runtime" xorm:"VARCHAR(32)"` // docker | kubernetes | systemd
	AgentVersion     string            `json:"agent_version" xorm:"VARCHAR(32)"`
	CertSerial       string            `json:"cert_serial" xorm:"VARCHAR(128)"`
	Status           ServerStatus      `json:"status" xorm:"VARCHAR(16)"`
	Health           ServerHealth      `json:"health" xorm:"VARCHAR(16)"`
	CPU              float64           `json:"cpu" xorm:"FLOAT"`
	Memory           float64           `json:"memory" xorm:"FLOAT"`
	Disk             float64           `json:"disk" xorm:"FLOAT"`
	Load             float64           `json:"load" xorm:"FLOAT"`
	UptimeSeconds    int64             `json:"uptime_seconds"`
	LastHeartbeat    int64             `json:"last_heartbeat" xorm:"INDEX"`
	CurrentReleaseID int64             `json:"current_release_id"`
	Maintenance      bool              `json:"maintenance"`
	Labels           map[string]string `json:"labels" xorm:"JSON 'labels'"`
	Metrics          MetricsSnapshot   `json:"metrics" xorm:"JSON 'metrics'"`
} //	@name	Server

func (Server) TableName() string {
	return "ops_servers"
}
