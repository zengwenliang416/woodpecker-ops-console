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

// NOTE: hand-maintained addition to the mockery-generated MockStore so that
// store.Store interface changes (OpsStore) compile without a working mockery
// toolchain on Go 1.26. Re-run `mockery` to regenerate the full expecter API.

package mocks

import (
	"go.woodpecker-ci.org/woodpecker/v3/server/model"
)

func (_m *MockStore) ServerCreate(server *model.Server) error {
	ret := _m.Called(server)
	return ret.Error(0)
}

func (_m *MockStore) ServerGet(id int64) (*model.Server, error) {
	ret := _m.Called(id)
	var r0 *model.Server
	if ret.Get(0) != nil {
		r0 = ret.Get(0).(*model.Server)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) ServerFindByName(name string) (*model.Server, error) {
	ret := _m.Called(name)
	var r0 *model.Server
	if ret.Get(0) != nil {
		r0 = ret.Get(0).(*model.Server)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) ServerList(p *model.ListOptions) ([]*model.Server, error) {
	ret := _m.Called(p)
	var r0 []*model.Server
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.Server)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) ServerListByGroup(groupID int64) ([]*model.Server, error) {
	ret := _m.Called(groupID)
	var r0 []*model.Server
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.Server)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) ServerUpdate(server *model.Server) error {
	ret := _m.Called(server)
	return ret.Error(0)
}

func (_m *MockStore) ServerDelete(id int64) error {
	ret := _m.Called(id)
	return ret.Error(0)
}

func (_m *MockStore) ServerGroupCreate(group *model.ServerGroup) error {
	ret := _m.Called(group)
	return ret.Error(0)
}

func (_m *MockStore) ServerGroupGet(id int64) (*model.ServerGroup, error) {
	ret := _m.Called(id)
	var r0 *model.ServerGroup
	if ret.Get(0) != nil {
		r0 = ret.Get(0).(*model.ServerGroup)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) ServerGroupList(p *model.ListOptions) ([]*model.ServerGroup, error) {
	ret := _m.Called(p)
	var r0 []*model.ServerGroup
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.ServerGroup)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) ServerGroupUpdate(group *model.ServerGroup) error {
	ret := _m.Called(group)
	return ret.Error(0)
}

func (_m *MockStore) ServerGroupDelete(id int64) error {
	ret := _m.Called(id)
	return ret.Error(0)
}

func (_m *MockStore) ApplicationCreate(app *model.Application) error {
	ret := _m.Called(app)
	return ret.Error(0)
}

func (_m *MockStore) ApplicationGet(id int64) (*model.Application, error) {
	ret := _m.Called(id)
	var r0 *model.Application
	if ret.Get(0) != nil {
		r0 = ret.Get(0).(*model.Application)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) ApplicationList(p *model.ListOptions) ([]*model.Application, error) {
	ret := _m.Called(p)
	var r0 []*model.Application
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.Application)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) ApplicationUpdate(app *model.Application) error {
	ret := _m.Called(app)
	return ret.Error(0)
}

func (_m *MockStore) ApplicationDelete(id int64) error {
	ret := _m.Called(id)
	return ret.Error(0)
}

func (_m *MockStore) EnvironmentCreate(env *model.Environment) error {
	ret := _m.Called(env)
	return ret.Error(0)
}

func (_m *MockStore) EnvironmentGet(id int64) (*model.Environment, error) {
	ret := _m.Called(id)
	var r0 *model.Environment
	if ret.Get(0) != nil {
		r0 = ret.Get(0).(*model.Environment)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) EnvironmentList(p *model.ListOptions) ([]*model.Environment, error) {
	ret := _m.Called(p)
	var r0 []*model.Environment
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.Environment)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) EnvironmentUpdate(env *model.Environment) error {
	ret := _m.Called(env)
	return ret.Error(0)
}

func (_m *MockStore) EnvironmentDelete(id int64) error {
	ret := _m.Called(id)
	return ret.Error(0)
}

func (_m *MockStore) AppReleaseCreate(release *model.AppRelease) error {
	ret := _m.Called(release)
	return ret.Error(0)
}

func (_m *MockStore) AppReleaseGet(id int64) (*model.AppRelease, error) {
	ret := _m.Called(id)
	var r0 *model.AppRelease
	if ret.Get(0) != nil {
		r0 = ret.Get(0).(*model.AppRelease)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) AppReleaseList(p *model.ListOptions) ([]*model.AppRelease, error) {
	ret := _m.Called(p)
	var r0 []*model.AppRelease
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.AppRelease)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) AppReleaseListByApplication(appID int64) ([]*model.AppRelease, error) {
	ret := _m.Called(appID)
	var r0 []*model.AppRelease
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.AppRelease)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) AppReleaseUpdate(release *model.AppRelease) error {
	ret := _m.Called(release)
	return ret.Error(0)
}

func (_m *MockStore) AppReleaseDelete(id int64) error {
	ret := _m.Called(id)
	return ret.Error(0)
}

func (_m *MockStore) DeploymentCreate(deployment *model.Deployment) error {
	ret := _m.Called(deployment)
	return ret.Error(0)
}

func (_m *MockStore) DeploymentGet(id int64) (*model.Deployment, error) {
	ret := _m.Called(id)
	var r0 *model.Deployment
	if ret.Get(0) != nil {
		r0 = ret.Get(0).(*model.Deployment)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) DeploymentList(p *model.ListOptions) ([]*model.Deployment, error) {
	ret := _m.Called(p)
	var r0 []*model.Deployment
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.Deployment)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) DeploymentListByApplication(appID int64) ([]*model.Deployment, error) {
	ret := _m.Called(appID)
	var r0 []*model.Deployment
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.Deployment)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) DeploymentListByServer(serverID int64) ([]*model.Deployment, error) {
	ret := _m.Called(serverID)
	var r0 []*model.Deployment
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.Deployment)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) DeploymentUpdate(deployment *model.Deployment) error {
	ret := _m.Called(deployment)
	return ret.Error(0)
}

func (_m *MockStore) DeploymentDelete(id int64) error {
	ret := _m.Called(id)
	return ret.Error(0)
}

func (_m *MockStore) DeploymentTargetUpsert(target *model.DeploymentTarget) error {
	ret := _m.Called(target)
	return ret.Error(0)
}

func (_m *MockStore) DeploymentTargetList(deploymentID int64) ([]*model.DeploymentTarget, error) {
	ret := _m.Called(deploymentID)
	var r0 []*model.DeploymentTarget
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.DeploymentTarget)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) DeploymentTargetDeleteByDeployment(deploymentID int64) error {
	ret := _m.Called(deploymentID)
	return ret.Error(0)
}

func (_m *MockStore) ApprovalCreate(approval *model.Approval) error {
	ret := _m.Called(approval)
	return ret.Error(0)
}

func (_m *MockStore) ApprovalListByDeployment(deploymentID int64) ([]*model.Approval, error) {
	ret := _m.Called(deploymentID)
	var r0 []*model.Approval
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.Approval)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) AlertCreate(alert *model.Alert) error {
	ret := _m.Called(alert)
	return ret.Error(0)
}

func (_m *MockStore) AlertGet(id int64) (*model.Alert, error) {
	ret := _m.Called(id)
	var r0 *model.Alert
	if ret.Get(0) != nil {
		r0 = ret.Get(0).(*model.Alert)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) AlertList(p *model.ListOptions) ([]*model.Alert, error) {
	ret := _m.Called(p)
	var r0 []*model.Alert
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.Alert)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) AlertListActive() ([]*model.Alert, error) {
	ret := _m.Called()
	var r0 []*model.Alert
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.Alert)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) AlertUpdate(alert *model.Alert) error {
	ret := _m.Called(alert)
	return ret.Error(0)
}

func (_m *MockStore) AuditLogCreate(log *model.AuditLog) error {
	ret := _m.Called(log)
	return ret.Error(0)
}

func (_m *MockStore) AuditLogList(p *model.ListOptions) ([]*model.AuditLog, error) {
	ret := _m.Called(p)
	var r0 []*model.AuditLog
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.AuditLog)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) NodeTaskCreate(task *model.NodeTask) error {
	ret := _m.Called(task)
	return ret.Error(0)
}

func (_m *MockStore) NodeTaskGet(id int64) (*model.NodeTask, error) {
	ret := _m.Called(id)
	var r0 *model.NodeTask
	if ret.Get(0) != nil {
		r0 = ret.Get(0).(*model.NodeTask)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) NodeTaskListPendingByServer(serverID int64) ([]*model.NodeTask, error) {
	ret := _m.Called(serverID)
	var r0 []*model.NodeTask
	if ret.Get(0) != nil {
		r0 = ret.Get(0).([]*model.NodeTask)
	}
	return r0, ret.Error(1)
}

func (_m *MockStore) NodeTaskUpdate(task *model.NodeTask) error {
	ret := _m.Called(task)
	return ret.Error(0)
}
