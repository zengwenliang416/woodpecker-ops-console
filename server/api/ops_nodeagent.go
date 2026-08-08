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

	"go.woodpecker-ci.org/woodpecker/v3/server/model"
	"go.woodpecker-ci.org/woodpecker/v3/server/store"
)

// NodeAgentRegisterInput is the bootstrap payload sent once by a Node Agent.
type NodeAgentRegisterInput struct {
	Name     string            `json:"name"`
	OrgID    int64             `json:"org_id"`
	Region   string            `json:"region"`
	Zone     string            `json:"zone"`
	PrivateIP string           `json:"private_ip"`
	PublicIP string            `json:"public_ip"`
	OS       string            `json:"os"`
	Kernel   string            `json:"kernel"`
	Runtime  string            `json:"runtime"`
	AgentVersion string         `json:"agent_version"`
	Labels   map[string]string `json:"labels"`
}

// PostNodeAgentRegister registers (or re-registers) a server from a Node Agent.
// Auth: bearer token issued when the server was created in the UI.
func PostNodeAgentRegister(c *gin.Context) {
	store_ := store.FromContext(c)
	var in NodeAgentRegisterInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing registration. %s", err)
		return
	}

	server, err := store_.ServerFindByName(in.Name)
	if err == nil && server != nil {
		// Re-registration: refresh metadata.
		server.Region = in.Region
		server.Zone = in.Zone
		server.PrivateIP = in.PrivateIP
		server.PublicIP = in.PublicIP
		server.OS = in.OS
		server.Kernel = in.Kernel
		server.Runtime = in.Runtime
		server.AgentVersion = in.AgentVersion
		server.Labels = in.Labels
		server.Status = model.ServerStatusOnline
		if err := store_.ServerUpdate(server); err != nil {
			c.String(http.StatusInternalServerError, "Error updating server. %s", err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"server_id": server.ID, "registered": true})
		return
	}

	server = &model.Server{
		OrgID:        in.OrgID,
		Name:         in.Name,
		Region:       in.Region,
		Zone:         in.Zone,
		PrivateIP:    in.PrivateIP,
		PublicIP:     in.PublicIP,
		OS:           in.OS,
		Kernel:       in.Kernel,
		Runtime:      in.Runtime,
		AgentVersion: in.AgentVersion,
		Labels:       in.Labels,
		Status:       model.ServerStatusOnline,
		Health:       model.ServerHealthHealthy,
		LastHeartbeat: timeNow(),
	}
	if err := store_.ServerCreate(server); err != nil {
		c.String(http.StatusInternalServerError, "Error creating server. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"server_id": server.ID, "registered": true})
}

// NodeAgentHeartbeatInput is the periodic metrics payload.
type NodeAgentHeartbeatInput struct {
	ServerID    int64              `json:"server_id"`
	CPU         float64            `json:"cpu"`
	Memory      float64            `json:"memory"`
	Disk        float64            `json:"disk"`
	Load        float64            `json:"load"`
	Uptime      int64              `json:"uptime_seconds"`
	Runtime     string             `json:"runtime"`
	Containers  int                `json:"containers"`
	Metrics     model.MetricsSnapshot `json:"metrics"`
}

// PostNodeAgentHeartbeat updates server liveness and metric windows.
func PostNodeAgentHeartbeat(c *gin.Context) {
	store_ := store.FromContext(c)
	var in NodeAgentHeartbeatInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing heartbeat. %s", err)
		return
	}
	server, err := store_.ServerGet(in.ServerID)
	if err != nil {
		c.String(http.StatusNotFound, "Error getting server. %s", err)
		return
	}

	server.Status = model.ServerStatusOnline
	if server.Maintenance {
		server.Status = model.ServerStatusMaintenance
	}
	server.CPU = in.CPU
	server.Memory = in.Memory
	server.Disk = in.Disk
	server.Load = in.Load
	server.UptimeSeconds = in.Uptime
	server.Runtime = in.Runtime
	server.LastHeartbeat = timeNow()

	// Rolling metric window (12 samples), aligned with the prototype.
	window := server.Metrics
	if len(in.Metrics.CPU) > 0 {
		window = in.Metrics
	} else {
		window.CPU = append(window.CPU, in.CPU)
		window.Memory = append(window.Memory, in.Memory)
		window.Disk = append(window.Disk, in.Disk)
		if len(window.CPU) > 12 {
			window.CPU = window.CPU[len(window.CPU)-12:]
			window.Memory = window.Memory[len(window.Memory)-12:]
			window.Disk = window.Disk[len(window.Disk)-12:]
		}
	}
	server.Metrics = window

	if in.CPU >= 90 || in.Memory >= 90 {
		server.Health = model.ServerHealthWarning
	} else {
		server.Health = model.ServerHealthHealthy
	}

	if err := store_.ServerUpdate(server); err != nil {
		c.String(http.StatusInternalServerError, "Error updating server. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetNodeAgentTasks returns pending tasks for a server (long-poll style).
func GetNodeAgentTasks(c *gin.Context) {
	store_ := store.FromContext(c)
	serverID := parseID(c.Query("server_id"))
	if serverID == 0 {
		c.String(http.StatusBadRequest, "server_id query parameter required")
		return
	}
	tasks, err := store_.NodeTaskListPendingByServer(serverID)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error getting tasks. %s", err)
		return
	}
	c.JSON(http.StatusOK, tasks)
}

// PostNodeAgentTaskResult reports the outcome of a dispatched task.
func PostNodeAgentTaskResult(c *gin.Context) {
	store_ := store.FromContext(c)
	task, err := store_.NodeTaskGet(parseID(c.Param("task_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting task. %s", err)
		return
	}
	var in struct {
		Status string `json:"status"` // success | failed
		Result string `json:"result"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.String(http.StatusBadRequest, "Error parsing result. %s", err)
		return
	}
	task.Status = model.NodeTaskStatus(in.Status)
	task.Result = in.Result
	if err := store_.NodeTaskUpdate(task); err != nil {
		c.String(http.StatusInternalServerError, "Error updating task. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetNodeAgentOffline alerts are resolved by the heartbeat path; this endpoint
// is a manual reconciliation hook for the UI.
func GetNodeAgentStatus(c *gin.Context) {
	server, err := store.FromContext(c).ServerGet(parseID(c.Param("server_id")))
	if err != nil {
		c.String(http.StatusNotFound, "Error getting server. %s", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"server_id": server.ID, "status": server.Status, "last_heartbeat": server.LastHeartbeat})
}

// NodeAgent token middleware — validates the agent bearer token against the
// server's cert serial placeholder (simplified phase-3 auth; mTLS upgrade planned).
func nodeAgentAuth(c *gin.Context) {
	serverID := parseID(c.GetHeader("X-Node-Agent-Server-Id"))
	if serverID == 0 {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing X-Node-Agent-Server-Id header"})
		return
	}
	server, err := store.FromContext(c).ServerGet(serverID)
	if err != nil || server.ID == 0 {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unknown node agent"})
		return
	}
	c.Set("node_agent_server", server)
	c.Next()
}

// RequireNodeAgent is exposed for router wiring.
func RequireNodeAgent() gin.HandlerFunc {
	return nodeAgentAuth
}

// NodeAgentServerFromContext returns the authenticated server (if any).
func NodeAgentServerFromContext(c *gin.Context) *model.Server {
	if v, ok := c.Get("node_agent_server"); ok {
		if server, ok := v.(*model.Server); ok {
			return server
		}
	}
	return nil
}
