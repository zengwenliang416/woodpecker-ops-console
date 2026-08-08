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

package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"go.woodpecker-ci.org/woodpecker/v3/server"
	"go.woodpecker-ci.org/woodpecker/v3/server/model"
	"go.woodpecker-ci.org/woodpecker/v3/server/router/middleware/session"
	"go.woodpecker-ci.org/woodpecker/v3/server/store"
)

// ---------- Applications ----------

// GetApplications returns the application list.
func GetApplications(c *gin.Context) {
	apps, err := store.FromContext(c).ApplicationList(session.Pagination(c))
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting applications. %s", err)
		return
	}
	c.JSON(http.StatusOK, apps)
}

// PostApplication creates an application.
func PostApplication(c *gin.Context) {
	in := new(model.Application)
	if err := c.ShouldBindJSON(in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing application. %s", err)
		return
	}
	if err := store.FromContext(c).ApplicationCreate(in); err != nil {
		c.String(http.StatusInternalServerError, "Error creating application. %s", err)
		return
	}
	c.JSON(http.StatusOK, in)
}

// GetApplication returns a single application with its releases.
func GetApplication(c *gin.Context) {
	store_ := store.FromContext(c)
	app, err := store_.ApplicationGet(parseID(c.Param("app_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting application. %s", err)
		return
	}
	releases, err := store_.AppReleaseListByApplication(app.ID)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting releases. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"application": app, "releases": releases})
}

// PatchApplication updates an application.
func PatchApplication(c *gin.Context) {
	store_ := store.FromContext(c)
	app, err := store_.ApplicationGet(parseID(c.Param("app_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting application. %s", err)
		return
	}
	in := new(model.Application)
	if err := c.ShouldBindJSON(in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing application. %s", err)
		return
	}
	in.ID = app.ID
	in.OrgID = app.OrgID
	if err := store_.ApplicationUpdate(in); err != nil {
		c.String(http.StatusInternalServerError, "Error updating application. %s", err)
		return
	}
	c.JSON(http.StatusOK, in)
}

// DeleteApplication removes an application.
func DeleteApplication(c *gin.Context) {
	store_ := store.FromContext(c)
	app, err := store_.ApplicationGet(parseID(c.Param("app_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting application. %s", err)
		return
	}
	if err := store_.ApplicationDelete(app.ID); err != nil {
		c.String(http.StatusInternalServerError, "Error deleting application. %s", err)
		return
	}
	c.Status(http.StatusNoContent)
}

// ---------- Environments ----------

// GetEnvironments returns the environment list.
func GetEnvironments(c *gin.Context) {
	envs, err := store.FromContext(c).EnvironmentList(session.Pagination(c))
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting environments. %s", err)
		return
	}
	c.JSON(http.StatusOK, envs)
}

// PostEnvironment creates an environment.
func PostEnvironment(c *gin.Context) {
	in := new(model.Environment)
	if err := c.ShouldBindJSON(in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing environment. %s", err)
		return
	}
	if err := store.FromContext(c).EnvironmentCreate(in); err != nil {
		c.String(http.StatusInternalServerError, "Error creating environment. %s", err)
		return
	}
	c.JSON(http.StatusOK, in)
}

// GetEnvironment returns a single environment with its server groups.
func GetEnvironment(c *gin.Context) {
	store_ := store.FromContext(c)
	env, err := store_.EnvironmentGet(parseID(c.Param("env_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting environment. %s", err)
		return
	}
	groups, err := store_.ServerGroupList(nil)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting server groups. %s", err)
		return
	}
	envGroups := make([]*model.ServerGroup, 0)
	for _, g := range groups {
		if g.EnvironmentID == env.ID {
			envGroups = append(envGroups, g)
		}
	}
	c.JSON(http.StatusOK, gin.H{"environment": env, "groups": envGroups})
}

// PatchEnvironment updates an environment.
func PatchEnvironment(c *gin.Context) {
	store_ := store.FromContext(c)
	env, err := store_.EnvironmentGet(parseID(c.Param("env_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting environment. %s", err)
		return
	}
	in := new(model.Environment)
	if err := c.ShouldBindJSON(in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing environment. %s", err)
		return
	}
	in.ID = env.ID
	in.OrgID = env.OrgID
	if err := store_.EnvironmentUpdate(in); err != nil {
		c.String(http.StatusInternalServerError, "Error updating environment. %s", err)
		return
	}
	c.JSON(http.StatusOK, in)
}

// DeleteEnvironment removes an environment.
func DeleteEnvironment(c *gin.Context) {
	store_ := store.FromContext(c)
	env, err := store_.EnvironmentGet(parseID(c.Param("env_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting environment. %s", err)
		return
	}
	if err := store_.EnvironmentDelete(env.ID); err != nil {
		c.String(http.StatusInternalServerError, "Error deleting environment. %s", err)
		return
	}
	c.Status(http.StatusNoContent)
}

// ---------- Releases ----------

// GetReleases returns the release list.
func GetReleases(c *gin.Context) {
	releases, err := store.FromContext(c).AppReleaseList(session.Pagination(c))
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting releases. %s", err)
		return
	}
	c.JSON(http.StatusOK, releases)
}

// PostRelease registers a release manually.
func PostRelease(c *gin.Context) {
	in := new(model.AppRelease)
	if err := c.ShouldBindJSON(in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing release. %s", err)
		return
	}
	if in.Status == "" {
		in.Status = model.AppReleaseStatusReady
	}
	if err := store.FromContext(c).AppReleaseCreate(in); err != nil {
		c.String(http.StatusInternalServerError, "Error creating release. %s", err)
		return
	}
	c.JSON(http.StatusOK, in)
}

// GetRelease returns a single release.
func GetRelease(c *gin.Context) {
	release, err := store.FromContext(c).AppReleaseGet(parseID(c.Param("release_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting release. %s", err)
		return
	}
	c.JSON(http.StatusOK, release)
}

// ---------- Deployments ----------

// GetDeployments returns the deployment list.
func GetDeployments(c *gin.Context) {
	deployments, err := store.FromContext(c).DeploymentList(session.Pagination(c))
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting deployments. %s", err)
		return
	}
	c.JSON(http.StatusOK, deployments)
}

// PostDeployment creates a deployment through the engine (wizard step 5 submit).
func PostDeployment(c *gin.Context) {
	engine := server.Config.Services.Ops
	if engine == nil {
		c.String(http.StatusServiceUnavailable, "Ops engine not initialized")
		return
	}
	var in struct {
		ApplicationID int64              `json:"application_id"`
		EnvironmentID int64              `json:"environment_id"`
		ReleaseID     int64              `json:"release_id"`
		GroupID       int64              `json:"group_id"`
		Strategy      model.DeployStrategy `json:"strategy"`
		BatchSize     int                `json:"batch_size"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing deployment. %s", err)
		return
	}
	store_ := store.FromContext(c)
	app, err := store_.ApplicationGet(in.ApplicationID)
	if err != nil {
		c.String(http.StatusNotFound, "Error getting application. %s", err)
		return
	}
	env, err := store_.EnvironmentGet(in.EnvironmentID)
	if err != nil {
		c.String(http.StatusNotFound, "Error getting environment. %s", err)
		return
	}
	release, err := store_.AppReleaseGet(in.ReleaseID)
	if err != nil {
		c.String(http.StatusNotFound, "Error getting release. %s", err)
		return
	}
	group, err := store_.ServerGroupGet(in.GroupID)
	if err != nil {
		c.String(http.StatusNotFound, "Error getting server group. %s", err)
		return
	}
	strategy := in.Strategy
	if strategy == "" {
		strategy = group.Strategy
	}
	batchSize := in.BatchSize
	if batchSize == 0 {
		batchSize = group.BatchSize
	}
	triggeredBy := "anonymous"
	if user := session.User(c); user != nil {
		triggeredBy = user.Login
	}

	deployment, err := engine.CreateDeployment(c, app, env, release, group, strategy, batchSize, triggeredBy)
	if err != nil {
		c.String(http.StatusConflict, "Error creating deployment. %s", err)
		return
	}
	c.JSON(http.StatusCreated, deployment)
}

// GetDeployment returns a single deployment with targets and approvals.
func GetDeployment(c *gin.Context) {
	store_ := store.FromContext(c)
	deployment, err := store_.DeploymentGet(parseID(c.Param("deployment_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting deployment. %s", err)
		return
	}
	targets, err := store_.DeploymentTargetList(deployment.ID)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting deployment targets. %s", err)
		return
	}
	approvals, err := store_.ApprovalListByDeployment(deployment.ID)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting approvals. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"deployment": deployment, "targets": targets, "approvals": approvals})
}

// GetDeploymentLogs returns the full deployment log.
func GetDeploymentLogs(c *gin.Context) {
	deployment, err := store.FromContext(c).DeploymentGet(parseID(c.Param("deployment_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting deployment. %s", err)
		return
	}
	c.JSON(http.StatusOK, deployment.Logs)
}

// PostDeploymentApprove approves a pending deployment.
func PostDeploymentApprove(c *gin.Context) {
	engine := server.Config.Services.Ops
	if engine == nil {
		c.String(http.StatusServiceUnavailable, "Ops engine not initialized")
		return
	}
	store_ := store.FromContext(c)
	deployment, err := store_.DeploymentGet(parseID(c.Param("deployment_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting deployment. %s", err)
		return
	}
	env, err := store_.EnvironmentGet(deployment.EnvironmentID)
	if err != nil {
		c.String(http.StatusNotFound, "Error getting environment. %s", err)
		return
	}
	var in struct {
		Comment string `json:"comment"`
	}
	_ = c.ShouldBindJSON(&in)
	approver := "anonymous"
	if user := session.User(c); user != nil {
		approver = user.Login
	}
	if err := engine.Approve(c, deployment.ID, approver, in.Comment, env.MinimumApprovers); err != nil {
		c.String(http.StatusConflict, "Error approving deployment. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"deployment_id": deployment.ID, "approved": true})
}

// PostDeploymentReject rejects a pending deployment.
func PostDeploymentReject(c *gin.Context) {
	engine := server.Config.Services.Ops
	if engine == nil {
		c.String(http.StatusServiceUnavailable, "Ops engine not initialized")
		return
	}
	var in struct {
		Comment string `json:"comment"`
	}
	_ = c.ShouldBindJSON(&in)
	approver := "anonymous"
	if user := session.User(c); user != nil {
		approver = user.Login
	}
	if err := engine.Reject(c, parseID(c.Param("deployment_id")), approver, in.Comment); err != nil {
		c.String(http.StatusConflict, "Error rejecting deployment. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"rejected": true})
}

// PostDeploymentPause pauses a running deployment.
func PostDeploymentPause(c *gin.Context) {
	if err := server.Config.Services.Ops.Pause(c, parseID(c.Param("deployment_id"))); err != nil {
		c.String(http.StatusConflict, "Error pausing deployment. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"paused": true})
}

// PostDeploymentResume resumes a paused deployment.
func PostDeploymentResume(c *gin.Context) {
	if err := server.Config.Services.Ops.Resume(c, parseID(c.Param("deployment_id"))); err != nil {
		c.String(http.StatusConflict, "Error resuming deployment. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"resumed": true})
}

// PostDeploymentCancel cancels a running deployment.
func PostDeploymentCancel(c *gin.Context) {
	if err := server.Config.Services.Ops.Cancel(c, parseID(c.Param("deployment_id"))); err != nil {
		c.String(http.StatusConflict, "Error cancelling deployment. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"cancelled": true})
}

// PostDeploymentAdvance manually advances the next batch.
func PostDeploymentAdvance(c *gin.Context) {
	if err := server.Config.Services.Ops.Advance(c, parseID(c.Param("deployment_id"))); err != nil {
		c.String(http.StatusConflict, "Error advancing deployment. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"advanced": true})
}

// PostDeploymentRetry retries failed nodes.
func PostDeploymentRetry(c *gin.Context) {
	var in struct {
		ServerIDs []int64 `json:"server_ids"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing retry request. %s", err)
		return
	}
	if err := server.Config.Services.Ops.Retry(c, parseID(c.Param("deployment_id")), in.ServerIDs); err != nil {
		c.String(http.StatusConflict, "Error retrying deployment. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"retried": true})
}

// PostDeploymentRollback creates a rollback deployment.
func PostDeploymentRollback(c *gin.Context) {
	triggeredBy := "anonymous"
	if user := session.User(c); user != nil {
		triggeredBy = user.Login
	}
	deployment, err := server.Config.Services.Ops.Rollback(c, parseID(c.Param("deployment_id")), triggeredBy)
	if err != nil {
		c.String(http.StatusConflict, "Error creating rollback. %s", err)
		return
	}
	c.JSON(http.StatusCreated, deployment)
}

// ---------- Policies & audit ----------

// GetPolicies returns the default deployment policies.
func GetPolicies(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"health_check_retries": 3,
		"health_check_interval": 5,
		"batch_size_default":   1,
		"auto_rollback":        true,
	})
}

// GetAuditLogs returns audit logs (admin only).
func GetAuditLogs(c *gin.Context) {
	logs, err := store.FromContext(c).AuditLogList(session.Pagination(c))
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting audit logs. %s", err)
		return
	}
	c.JSON(http.StatusOK, logs)
}
