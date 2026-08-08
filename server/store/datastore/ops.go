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

package datastore

import (
	"go.woodpecker-ci.org/woodpecker/v3/server/model"
)

// ---------- Servers ----------

func (s storage) ServerCreate(server *model.Server) error {
	_, err := s.engine.Insert(server)
	return err
}

func (s storage) ServerGet(id int64) (*model.Server, error) {
	server := new(model.Server)
	return server, wrapGet(s.engine.ID(id).Get(server))
}

func (s storage) ServerFindByName(name string) (*model.Server, error) {
	server := new(model.Server)
	return server, wrapGet(s.engine.Where("name = ?", name).Get(server))
}

func (s storage) ServerList(p *model.ListOptions) (servers []*model.Server, _ error) {
	return servers, s.paginate(p).OrderBy("id").Find(&servers)
}

func (s storage) ServerListByGroup(groupID int64) (servers []*model.Server, _ error) {
	return servers, s.engine.Where("group_id = ?", groupID).OrderBy("id").Find(&servers)
}

func (s storage) ServerUpdate(server *model.Server) error {
	_, err := s.engine.ID(server.ID).AllCols().Update(server)
	return err
}

func (s storage) ServerDelete(id int64) error {
	_, err := s.engine.ID(id).Delete(new(model.Server))
	return err
}

// ---------- Server groups ----------

func (s storage) ServerGroupCreate(group *model.ServerGroup) error {
	_, err := s.engine.Insert(group)
	return err
}

func (s storage) ServerGroupGet(id int64) (*model.ServerGroup, error) {
	group := new(model.ServerGroup)
	return group, wrapGet(s.engine.ID(id).Get(group))
}

func (s storage) ServerGroupList(p *model.ListOptions) (groups []*model.ServerGroup, _ error) {
	return groups, s.paginate(p).OrderBy("id").Find(&groups)
}

func (s storage) ServerGroupUpdate(group *model.ServerGroup) error {
	_, err := s.engine.ID(group.ID).AllCols().Update(group)
	return err
}

func (s storage) ServerGroupDelete(id int64) error {
	_, err := s.engine.ID(id).Delete(new(model.ServerGroup))
	return err
}

// ---------- Applications ----------

func (s storage) ApplicationCreate(app *model.Application) error {
	_, err := s.engine.Insert(app)
	return err
}

func (s storage) ApplicationGet(id int64) (*model.Application, error) {
	app := new(model.Application)
	return app, wrapGet(s.engine.ID(id).Get(app))
}

func (s storage) ApplicationList(p *model.ListOptions) (apps []*model.Application, _ error) {
	return apps, s.paginate(p).OrderBy("id").Find(&apps)
}

func (s storage) ApplicationUpdate(app *model.Application) error {
	_, err := s.engine.ID(app.ID).AllCols().Update(app)
	return err
}

func (s storage) ApplicationDelete(id int64) error {
	_, err := s.engine.ID(id).Delete(new(model.Application))
	return err
}

// ---------- Environments ----------

func (s storage) EnvironmentCreate(env *model.Environment) error {
	_, err := s.engine.Insert(env)
	return err
}

func (s storage) EnvironmentGet(id int64) (*model.Environment, error) {
	env := new(model.Environment)
	return env, wrapGet(s.engine.ID(id).Get(env))
}

func (s storage) EnvironmentList(p *model.ListOptions) (envs []*model.Environment, _ error) {
	return envs, s.paginate(p).OrderBy("id").Find(&envs)
}

func (s storage) EnvironmentUpdate(env *model.Environment) error {
	_, err := s.engine.ID(env.ID).AllCols().Update(env)
	return err
}

func (s storage) EnvironmentDelete(id int64) error {
	_, err := s.engine.ID(id).Delete(new(model.Environment))
	return err
}

// ---------- AppReleases ----------

func (s storage) AppReleaseCreate(release *model.AppRelease) error {
	_, err := s.engine.Insert(release)
	return err
}

func (s storage) AppReleaseGet(id int64) (*model.AppRelease, error) {
	release := new(model.AppRelease)
	return release, wrapGet(s.engine.ID(id).Get(release))
}

func (s storage) AppReleaseList(p *model.ListOptions) (releases []*model.AppRelease, _ error) {
	return releases, s.paginate(p).OrderBy("id DESC").Find(&releases)
}

func (s storage) AppReleaseListByApplication(appID int64) (releases []*model.AppRelease, _ error) {
	return releases, s.engine.Where("application_id = ?", appID).OrderBy("id DESC").Find(&releases)
}

func (s storage) AppReleaseUpdate(release *model.AppRelease) error {
	_, err := s.engine.ID(release.ID).AllCols().Update(release)
	return err
}

func (s storage) AppReleaseDelete(id int64) error {
	_, err := s.engine.ID(id).Delete(new(model.AppRelease))
	return err
}

// ---------- Deployments ----------

func (s storage) DeploymentCreate(deployment *model.Deployment) error {
	_, err := s.engine.Insert(deployment)
	return err
}

func (s storage) DeploymentGet(id int64) (*model.Deployment, error) {
	deployment := new(model.Deployment)
	return deployment, wrapGet(s.engine.ID(id).Get(deployment))
}

func (s storage) DeploymentList(p *model.ListOptions) (deployments []*model.Deployment, _ error) {
	return deployments, s.paginate(p).OrderBy("id DESC").Find(&deployments)
}

func (s storage) DeploymentListByApplication(appID int64) (deployments []*model.Deployment, _ error) {
	return deployments, s.engine.Where("application_id = ?", appID).OrderBy("id DESC").Find(&deployments)
}

func (s storage) DeploymentListByServer(serverID int64) (deployments []*model.Deployment, _ error) {
	var targets []*model.DeploymentTarget
	if err := s.engine.Where("server_id = ?", serverID).Find(&targets); err != nil {
		return nil, err
	}
	ids := make([]int64, 0, len(targets))
	for _, t := range targets {
		ids = append(ids, t.DeploymentID)
	}
	if len(ids) == 0 {
		return nil, nil
	}
	return deployments, s.engine.In("id", ids).OrderBy("id DESC").Find(&deployments)
}

func (s storage) DeploymentUpdate(deployment *model.Deployment) error {
	_, err := s.engine.ID(deployment.ID).AllCols().Update(deployment)
	return err
}

func (s storage) DeploymentDelete(id int64) error {
	_, err := s.engine.ID(id).Delete(new(model.Deployment))
	return err
}

// ---------- Deployment targets ----------

func (s storage) DeploymentTargetUpsert(target *model.DeploymentTarget) error {
	exists, err := s.engine.Where("deployment_id = ? AND server_id = ?", target.DeploymentID, target.ServerID).Exist(new(model.DeploymentTarget))
	if err != nil {
		return err
	}
	if exists {
		_, err = s.engine.Where("deployment_id = ? AND server_id = ?", target.DeploymentID, target.ServerID).AllCols().Update(target)
		return err
	}
	_, err = s.engine.Insert(target)
	return err
}

func (s storage) DeploymentTargetList(deploymentID int64) (targets []*model.DeploymentTarget, _ error) {
	return targets, s.engine.Where("deployment_id = ?", deploymentID).OrderBy("deployment_id").Find(&targets)
}

func (s storage) DeploymentTargetDeleteByDeployment(deploymentID int64) error {
	_, err := s.engine.Where("deployment_id = ?", deploymentID).Delete(new(model.DeploymentTarget))
	return err
}

// ---------- Approvals ----------

func (s storage) ApprovalCreate(approval *model.Approval) error {
	_, err := s.engine.Insert(approval)
	return err
}

func (s storage) ApprovalListByDeployment(deploymentID int64) (approvals []*model.Approval, _ error) {
	return approvals, s.engine.Where("deployment_id = ?", deploymentID).OrderBy("id").Find(&approvals)
}

// ---------- Alerts ----------

func (s storage) AlertCreate(alert *model.Alert) error {
	_, err := s.engine.Insert(alert)
	return err
}

func (s storage) AlertGet(id int64) (*model.Alert, error) {
	alert := new(model.Alert)
	return alert, wrapGet(s.engine.ID(id).Get(alert))
}

func (s storage) AlertList(p *model.ListOptions) (alerts []*model.Alert, _ error) {
	return alerts, s.paginate(p).OrderBy("id DESC").Find(&alerts)
}

func (s storage) AlertListActive() (alerts []*model.Alert, _ error) {
	return alerts, s.engine.Where("status = ?", model.AlertStatusActive).OrderBy("id DESC").Find(&alerts)
}

func (s storage) AlertUpdate(alert *model.Alert) error {
	_, err := s.engine.ID(alert.ID).AllCols().Update(alert)
	return err
}

// ---------- Audit logs ----------

func (s storage) AuditLogCreate(log *model.AuditLog) error {
	_, err := s.engine.Insert(log)
	return err
}

func (s storage) AuditLogList(p *model.ListOptions) (logs []*model.AuditLog, _ error) {
	return logs, s.paginate(p).OrderBy("id DESC").Find(&logs)
}

// ---------- Node tasks ----------

func (s storage) NodeTaskCreate(task *model.NodeTask) error {
	_, err := s.engine.Insert(task)
	return err
}

func (s storage) NodeTaskGet(id int64) (*model.NodeTask, error) {
	task := new(model.NodeTask)
	return task, wrapGet(s.engine.ID(id).Get(task))
}

func (s storage) NodeTaskListPendingByServer(serverID int64) (tasks []*model.NodeTask, _ error) {
	return tasks, s.engine.Where("server_id = ? AND status = ?", serverID, model.NodeTaskStatusPending).OrderBy("id").Find(&tasks)
}

func (s storage) NodeTaskUpdate(task *model.NodeTask) error {
	_, err := s.engine.ID(task.ID).AllCols().Update(task)
	return err
}
