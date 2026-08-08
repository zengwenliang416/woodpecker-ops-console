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

package store

import "go.woodpecker-ci.org/woodpecker/v3/server/model"

// OpsStore is the persistence interface for the Infrastructure &
// Deployment control plane.
type OpsStore interface {
	// Servers
	ServerCreate(*model.Server) error
	ServerGet(int64) (*model.Server, error)
	ServerFindByName(string) (*model.Server, error)
	ServerList(*model.ListOptions) ([]*model.Server, error)
	ServerListByGroup(int64) ([]*model.Server, error)
	ServerUpdate(*model.Server) error
	ServerDelete(int64) error

	// Server groups
	ServerGroupCreate(*model.ServerGroup) error
	ServerGroupGet(int64) (*model.ServerGroup, error)
	ServerGroupList(*model.ListOptions) ([]*model.ServerGroup, error)
	ServerGroupUpdate(*model.ServerGroup) error
	ServerGroupDelete(int64) error

	// Applications
	ApplicationCreate(*model.Application) error
	ApplicationGet(int64) (*model.Application, error)
	ApplicationList(*model.ListOptions) ([]*model.Application, error)
	ApplicationUpdate(*model.Application) error
	ApplicationDelete(int64) error

	// Environments
	EnvironmentCreate(*model.Environment) error
	EnvironmentGet(int64) (*model.Environment, error)
	EnvironmentList(*model.ListOptions) ([]*model.Environment, error)
	EnvironmentUpdate(*model.Environment) error
	EnvironmentDelete(int64) error

	// AppReleases
	AppReleaseCreate(*model.AppRelease) error
	AppReleaseGet(int64) (*model.AppRelease, error)
	AppReleaseList(*model.ListOptions) ([]*model.AppRelease, error)
	AppReleaseListByApplication(int64) ([]*model.AppRelease, error)
	AppReleaseUpdate(*model.AppRelease) error
	AppReleaseDelete(int64) error

	// Deployments
	DeploymentCreate(*model.Deployment) error
	DeploymentGet(int64) (*model.Deployment, error)
	DeploymentList(*model.ListOptions) ([]*model.Deployment, error)
	DeploymentListByApplication(int64) ([]*model.Deployment, error)
	DeploymentListByServer(int64) ([]*model.Deployment, error)
	DeploymentUpdate(*model.Deployment) error
	DeploymentDelete(int64) error

	// Deployment targets
	DeploymentTargetUpsert(*model.DeploymentTarget) error
	DeploymentTargetList(int64) ([]*model.DeploymentTarget, error)
	DeploymentTargetDeleteByDeployment(int64) error

	// Approvals
	ApprovalCreate(*model.Approval) error
	ApprovalListByDeployment(int64) ([]*model.Approval, error)

	// Alerts
	AlertCreate(*model.Alert) error
	AlertGet(int64) (*model.Alert, error)
	AlertList(*model.ListOptions) ([]*model.Alert, error)
	AlertListActive() ([]*model.Alert, error)
	AlertUpdate(*model.Alert) error

	// Audit logs
	AuditLogCreate(*model.AuditLog) error
	AuditLogList(*model.ListOptions) ([]*model.AuditLog, error)

	// Node tasks
	NodeTaskCreate(*model.NodeTask) error
	NodeTaskGet(int64) (*model.NodeTask, error)
	NodeTaskListPendingByServer(int64) ([]*model.NodeTask, error)
	NodeTaskUpdate(*model.NodeTask) error
}
