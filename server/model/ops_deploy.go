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

// DeployStrategy is the rollout strategy for a deployment.
type DeployStrategy string

const (
	DeployStrategySingle     DeployStrategy = "single"
	DeployStrategyAllAtOnce  DeployStrategy = "all-at-once"
	DeployStrategyRolling    DeployStrategy = "rolling"
)

// ServerGroup groups servers and carries the default deployment strategy.
type ServerGroup struct {
	ID            int64             `json:"id" xorm:"pk autoincr 'id'"`
	Created       int64             `json:"created" xorm:"created"`
	Updated       int64             `json:"updated" xorm:"updated"`
	OrgID         int64             `json:"org_id" xorm:"INDEX 'org_id'"`
	EnvironmentID int64             `json:"environment_id" xorm:"INDEX 'environment_id'"`
	Name          string            `json:"name" xorm:"UNIQUE 'name'"`
	Description   string            `json:"description" xorm:"VARCHAR(255)"`
	Strategy      DeployStrategy    `json:"strategy" xorm:"VARCHAR(16)"`
	BatchSize     int               `json:"batch_size"`
	HealthPath    string            `json:"health_path" xorm:"VARCHAR(255)"`
	Port          int               `json:"port"`
	Labels        map[string]string `json:"labels" xorm:"JSON 'labels'"`
} //	@name	ServerGroup

func (ServerGroup) TableName() string {
	return "ops_server_groups"
}

// Application links a CI repository with deployable artifacts.
type Application struct {
	ID          int64  `json:"id" xorm:"pk autoincr 'id'"`
	Created     int64  `json:"created" xorm:"created"`
	Updated     int64  `json:"updated" xorm:"updated"`
	OrgID       int64  `json:"org_id" xorm:"INDEX 'org_id'"`
	RepoID      int64  `json:"repo_id" xorm:"INDEX 'repo_id'"`
	Name        string `json:"name" xorm:"UNIQUE 'name'"`
	Description string `json:"description" xorm:"VARCHAR(255)"`
	Image       string `json:"image" xorm:"VARCHAR(255)"`
	Runtime     string `json:"runtime" xorm:"VARCHAR(16)"` // docker-compose | kubernetes | systemd
	ComposeFile string `json:"compose_file" xorm:"VARCHAR(255)"`
	Service     string `json:"service" xorm:"VARCHAR(128)"`
	HealthPath  string `json:"health_path" xorm:"VARCHAR(255)"`
	Port        int    `json:"port"`
	OwnerTeam   string `json:"owner_team" xorm:"VARCHAR(64)"`
} //	@name	Application

func (Application) TableName() string {
	return "ops_applications"
}

// Environment carries protection and approval policy for deployments.
type Environment struct {
	ID               int64  `json:"id" xorm:"pk autoincr 'id'"`
	Created          int64  `json:"created" xorm:"created"`
	Updated          int64  `json:"updated" xorm:"updated"`
	OrgID            int64  `json:"org_id" xorm:"INDEX 'org_id'"`
	Name             string `json:"name" xorm:"UNIQUE 'name'"`
	Title            string `json:"title" xorm:"VARCHAR(64)"`
	Protected        bool   `json:"protected"`
	ApprovalRequired bool   `json:"approval_required"`
	MinimumApprovers int    `json:"minimum_approvers"`
	AutoRollback     bool   `json:"auto_rollback"`
	DeployWindow     string `json:"deploy_window" xorm:"VARCHAR(128)"`
	Domain           string `json:"domain" xorm:"VARCHAR(255)"`
	Color            string `json:"color" xorm:"VARCHAR(16)"`
} //	@name	Environment

func (Environment) TableName() string {
	return "ops_environments"
}

// AppReleaseStatus describes the lifecycle of an immutable release artifact.
type AppReleaseStatus string

const (
	AppReleaseStatusReady     AppReleaseStatus = "ready"
	AppReleaseStatusDeployed  AppReleaseStatus = "deployed"
	AppReleaseStatusSuperseded AppReleaseStatus = "superseded"
	AppReleaseStatusRolledBack AppReleaseStatus = "rolled_back"
)

// AppRelease is an immutable build artifact produced by a successful pipeline.
type AppRelease struct {
	ID            int64         `json:"id" xorm:"pk autoincr 'id'"`
	Created       int64         `json:"created" xorm:"created"`
	Updated       int64         `json:"updated" xorm:"updated"`
	OrgID         int64         `json:"org_id" xorm:"INDEX 'org_id'"`
	ApplicationID int64         `json:"application_id" xorm:"INDEX 'application_id'"`
	PipelineID    int64         `json:"pipeline_id" xorm:"INDEX 'pipeline_id'"`
	Version       string        `json:"version" xorm:"VARCHAR(64)"`
	Commit        string        `json:"commit" xorm:"VARCHAR(64)"`
	Digest        string        `json:"digest" xorm:"VARCHAR(128)"`
	Image         string        `json:"image" xorm:"VARCHAR(255)"`
	SizeBytes     int64         `json:"size_bytes"`
	Author        string        `json:"author" xorm:"VARCHAR(64)"`
	Status        AppReleaseStatus `json:"status" xorm:"VARCHAR(16)"`
	Note          string        `json:"note" xorm:"VARCHAR(255)"`
} //	@name	AppRelease

func (AppRelease) TableName() string {
	return "ops_releases"
}
