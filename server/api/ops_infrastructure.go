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
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"go.woodpecker-ci.org/woodpecker/v3/server/model"
	"go.woodpecker-ci.org/woodpecker/v3/server/router/middleware/session"
	"go.woodpecker-ci.org/woodpecker/v3/server/store"
)

// InfrastructureOverview aggregates dashboard metrics for the infrastructure overview page.
type InfrastructureOverview struct {
	ServerCount       int              `json:"server_count"`
	ServerOnline      int              `json:"server_online"`
	ServerMaintenance int              `json:"server_maintenance"`
	ServerOffline     int              `json:"server_offline"`
	AvgCPU            float64          `json:"avg_cpu"`
	AvgMemory         float64          `json:"avg_memory"`
	AvgDisk           float64          `json:"avg_disk"`
	ActiveAlerts      int              `json:"active_alerts"`
	GroupCount        int              `json:"group_count"`
	Servers           []*model.Server  `json:"servers"`
	Groups            []*model.ServerGroup `json:"groups"`
	Alerts            []*model.Alert   `json:"alerts"`
}

// GetInfrastructureOverview returns the aggregated infrastructure dashboard.
func GetInfrastructureOverview(c *gin.Context) {
	store_ := store.FromContext(c)

	servers, err := store_.ServerList(nil)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting servers. %s", err)
		return
	}
	groups, err := store_.ServerGroupList(nil)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting server groups. %s", err)
		return
	}
	alerts, err := store_.AlertListActive()
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting alerts. %s", err)
		return
	}

	overview := &InfrastructureOverview{
		ServerCount:  len(servers),
		GroupCount:   len(groups),
		ActiveAlerts: len(alerts),
		Servers:      servers,
		Groups:       groups,
		Alerts:       alerts,
	}
	for _, s := range servers {
		switch s.Status {
		case model.ServerStatusOnline:
			overview.ServerOnline++
		case model.ServerStatusMaintenance:
			overview.ServerMaintenance++
		case model.ServerStatusOffline:
			overview.ServerOffline++
		}
		overview.AvgCPU += s.CPU
		overview.AvgMemory += s.Memory
		overview.AvgDisk += s.Disk
	}
	if len(servers) > 0 {
		overview.AvgCPU = overview.AvgCPU / float64(len(servers))
		overview.AvgMemory = overview.AvgMemory / float64(len(servers))
		overview.AvgDisk = overview.AvgDisk / float64(len(servers))
	}

	c.JSON(http.StatusOK, overview)
}

// GetServers returns the server list with pagination.
func GetServers(c *gin.Context) {
	servers, err := store.FromContext(c).ServerList(session.Pagination(c))
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting server list. %s", err)
		return
	}
	c.JSON(http.StatusOK, servers)
}

// GetServer returns a single server.
func GetServer(c *gin.Context) {
	server, err := store.FromContext(c).ServerGet(parseID(c.Param("server_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting server. %s", err)
		return
	}
	c.JSON(http.StatusOK, server)
}

// PostServer registers a new server (Node Agent bootstrap).
func PostServer(c *gin.Context) {
	in := new(model.Server)
	if err := c.ShouldBindJSON(in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing server. %s", err)
		return
	}
	user := session.User(c)
	if user != nil {
		in.OrgID = user.OrgID
	}
	if in.Status == "" {
		in.Status = model.ServerStatusOffline
	}
	if in.Health == "" {
		in.Health = model.ServerHealthHealthy
	}
	if err := store.FromContext(c).ServerCreate(in); err != nil {
		c.String(http.StatusInternalServerError, "Error creating server. %s", err)
		return
	}
	c.JSON(http.StatusOK, in)
}

// PatchServer updates mutable fields of a server (labels, group, etc).
func PatchServer(c *gin.Context) {
	store_ := store.FromContext(c)
	server, err := store_.ServerGet(parseID(c.Param("server_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting server. %s", err)
		return
	}
	in := new(model.Server)
	if err := c.ShouldBindJSON(in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing server. %s", err)
		return
	}
	in.ID = server.ID
	in.OrgID = server.OrgID
	if err := store_.ServerUpdate(in); err != nil {
		c.String(http.StatusInternalServerError, "Error updating server. %s", err)
		return
	}
	c.JSON(http.StatusOK, in)
}

// DeleteServer removes a server after cert revocation confirmation.
func DeleteServer(c *gin.Context) {
	store_ := store.FromContext(c)
	server, err := store_.ServerGet(parseID(c.Param("server_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting server. %s", err)
		return
	}
	if err := store_.ServerDelete(server.ID); err != nil {
		c.String(http.StatusInternalServerError, "Error deleting server. %s", err)
		return
	}
	c.Status(http.StatusNoContent)
}

// PostServerMaintenance toggles the maintenance mode of a server.
func PostServerMaintenance(c *gin.Context) {
	store_ := store.FromContext(c)
	server, err := store_.ServerGet(parseID(c.Param("server_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting server. %s", err)
		return
	}
	var in struct {
		Maintenance bool `json:"maintenance"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing request. %s", err)
		return
	}
	server.Maintenance = in.Maintenance
	if in.Maintenance {
		server.Status = model.ServerStatusMaintenance
	} else {
		server.Status = model.ServerStatusOnline
	}
	if err := store_.ServerUpdate(server); err != nil {
		c.String(http.StatusInternalServerError, "Error updating server. %s", err)
		return
	}
	c.JSON(http.StatusOK, server)
}

// PostServerRestart simulates restarting the node agent or a service.
func PostServerRestart(c *gin.Context) {
	server, err := store.FromContext(c).ServerGet(parseID(c.Param("server_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting server. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"server_id": server.ID, "restarted": true})
}

// GetServerDeployments lists deployments involving a server.
func GetServerDeployments(c *gin.Context) {
	deployments, err := store.FromContext(c).DeploymentListByServer(parseID(c.Param("server_id")))
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting deployments. %s", err)
		return
	}
	c.JSON(http.StatusOK, deployments)
}

// ---------- Server groups ----------

// GetServerGroups returns the server group list.
func GetServerGroups(c *gin.Context) {
	groups, err := store.FromContext(c).ServerGroupList(session.Pagination(c))
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting server groups. %s", err)
		return
	}
	c.JSON(http.StatusOK, groups)
}

// PostServerGroup creates a server group.
func PostServerGroup(c *gin.Context) {
	in := new(model.ServerGroup)
	if err := c.ShouldBindJSON(in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing server group. %s", err)
		return
	}
	if in.Strategy == "" {
		in.Strategy = model.DeployStrategyRolling
	}
	if in.BatchSize == 0 {
		in.BatchSize = 1
	}
	if err := store.FromContext(c).ServerGroupCreate(in); err != nil {
		c.String(http.StatusInternalServerError, "Error creating server group. %s", err)
		return
	}
	c.JSON(http.StatusOK, in)
}

// GetServerGroup returns a single server group.
func GetServerGroup(c *gin.Context) {
	group, err := store.FromContext(c).ServerGroupGet(parseID(c.Param("group_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting server group. %s", err)
		return
	}
	c.JSON(http.StatusOK, group)
}

// PatchServerGroup updates a server group.
func PatchServerGroup(c *gin.Context) {
	store_ := store.FromContext(c)
	group, err := store_.ServerGroupGet(parseID(c.Param("group_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting server group. %s", err)
		return
	}
	in := new(model.ServerGroup)
	if err := c.ShouldBindJSON(in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing server group. %s", err)
		return
	}
	in.ID = group.ID
	in.OrgID = group.OrgID
	if err := store_.ServerGroupUpdate(in); err != nil {
		c.String(http.StatusInternalServerError, "Error updating server group. %s", err)
		return
	}
	c.JSON(http.StatusOK, in)
}

// DeleteServerGroup removes a server group.
func DeleteServerGroup(c *gin.Context) {
	store_ := store.FromContext(c)
	group, err := store_.ServerGroupGet(parseID(c.Param("group_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting server group. %s", err)
		return
	}
	if err := store_.ServerGroupDelete(group.ID); err != nil {
		c.String(http.StatusInternalServerError, "Error deleting server group. %s", err)
		return
	}
	c.Status(http.StatusNoContent)
}

// GetServices returns the aggregated services view across servers.
func GetServices(c *gin.Context) {
	servers, err := store.FromContext(c).ServerList(nil)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting servers. %s", err)
		return
	}
	type serviceView struct {
		ServerID   int64   `json:"server_id"`
		ServerName string  `json:"server_name"`
		Runtime    string  `json:"runtime"`
		Status     string  `json:"status"`
		Containers int     `json:"containers"`
		CPU        float64 `json:"cpu"`
		Memory     float64 `json:"memory"`
	}
	services := make([]serviceView, 0, len(servers))
	for _, s := range servers {
		status := "healthy"
		if s.Status == model.ServerStatusOffline {
			status = "unreachable"
		} else if s.Status == model.ServerStatusMaintenance {
			status = "stopped"
		} else if s.Health == model.ServerHealthWarning {
			status = "degraded"
		}
		services = append(services, serviceView{
			ServerID:   s.ID,
			ServerName: s.Name,
			Runtime:    s.Runtime,
			Status:     status,
			Containers: len(s.Metrics.CPU),
			CPU:        s.CPU,
			Memory:     s.Memory,
		})
	}
	c.JSON(http.StatusOK, services)
}

// ---------- Alerts ----------

// GetAlerts returns alerts with pagination.
func GetAlerts(c *gin.Context) {
	alerts, err := store.FromContext(c).AlertList(session.Pagination(c))
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting alerts. %s", err)
		return
	}
	c.JSON(http.StatusOK, alerts)
}

// PostAlertAcknowledge acknowledges an alert.
func PostAlertAcknowledge(c *gin.Context) {
	store_ := store.FromContext(c)
	alert, err := store_.AlertGet(parseID(c.Param("alert_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting alert. %s", err)
		return
	}
	alert.Status = model.AlertStatusAcknowledged
	if user := session.User(c); user != nil {
		alert.AcknowledgedBy = user.Login
	}
	if err := store_.AlertUpdate(alert); err != nil {
		c.String(http.StatusInternalServerError, "Error updating alert. %s", err)
		return
	}
	c.JSON(http.StatusOK, alert)
}

// PostAlertResolve resolves an alert.
func PostAlertResolve(c *gin.Context) {
	store_ := store.FromContext(c)
	alert, err := store_.AlertGet(parseID(c.Param("alert_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting alert. %s", err)
		return
	}
	alert.Status = model.AlertStatusResolved
	if user := session.User(c); user != nil {
		alert.ResolvedBy = user.Login
	}
	alert.ResolvedAt = timeNow()
	if err := store_.AlertUpdate(alert); err != nil {
		c.String(http.StatusInternalServerError, "Error updating alert. %s", err)
		return
	}
	c.JSON(http.StatusOK, alert)
}

// ---------- helpers ----------

func parseID(s string) int64 {
	id, _ := strconv.ParseInt(s, 10, 64)
	return id
}

func timeNow() int64 {
	return time.Now().Unix()
}
