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

package core

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog/log"

	"go.woodpecker-ci.org/woodpecker/v3/server/model"
)

// Config holds the Node Agent runtime configuration.
type Config struct {
	ServerURL         string
	Name              string
	ServerID          int64
	OrgID             int64
	AgentToken        string
	Insecure          bool
	HeartbeatInterval int
	Runtime           string
}

// Run starts the Node Agent main loops: register → heartbeat + task polling.
func Run(ctx context.Context, cfg *Config) error {
	client := &http.Client{Timeout: 30 * time.Second}
	if cfg.Insecure {
		client = &http.Client{Timeout: 30 * time.Second, Transport: http.DefaultTransport}
	}

	if cfg.ServerID == 0 {
		id, err := register(ctx, client, cfg)
		if err != nil {
			return fmt.Errorf("registration failed: %w", err)
		}
		cfg.ServerID = id
		log.Info().Int64("server_id", id).Msg("registered node agent")
	}

	heartbeatTicker := time.NewTicker(time.Duration(cfg.HeartbeatInterval) * time.Second)
	taskTicker := time.NewTicker(2 * time.Second)
	defer heartbeatTicker.Stop()
	defer taskTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Info().Msg("node agent stopped")
			return nil
		case <-heartbeatTicker.C:
			if err := sendHeartbeat(ctx, client, cfg); err != nil {
				log.Warn().Err(err).Msg("heartbeat failed")
			}
		case <-taskTicker.C:
			if err := pollTasks(ctx, client, cfg); err != nil {
				log.Warn().Err(err).Msg("task poll failed")
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Registration

func register(ctx context.Context, client *http.Client, cfg *Config) (int64, error) {
	hostname, _ := os.Hostname()
	body, _ := json.Marshal(map[string]any{
		"name":          cfg.Name,
		"org_id":        cfg.OrgID,
		"private_ip":    localIP(),
		"os":            runtime.GOOS,
		"runtime":       cfg.Runtime,
		"agent_version": "0.1.0",
		"hostname":      hostname,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cfg.ServerURL+"/api/node-agent/register", bytes.NewReader(body))
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	setAuth(req, cfg)

	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(resp.Body)
		return 0, fmt.Errorf("register: %s: %s", resp.Status, string(raw))
	}
	var out struct {
		ServerID int64 `json:"server_id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return 0, err
	}
	return out.ServerID, nil
}

func setAuth(req *http.Request, cfg *Config) {
	if cfg.AgentToken != "" {
		req.Header.Set("Authorization", "Bearer "+cfg.AgentToken)
	}
	req.Header.Set("X-Node-Agent-Server-Id", strconv.FormatInt(cfg.ServerID, 10))
}

// ---------------------------------------------------------------------------
// Heartbeat & metrics

type heartbeatPayload struct {
	ServerID   int64                `json:"server_id"`
	CPU        float64              `json:"cpu"`
	Memory     float64              `json:"memory"`
	Disk       float64              `json:"disk"`
	Load       float64              `json:"load"`
	Uptime     int64                `json:"uptime_seconds"`
	Runtime    string               `json:"runtime"`
	Containers int                  `json:"containers"`
	Metrics    model.MetricsSnapshot `json:"metrics"`
}

func sendHeartbeat(ctx context.Context, client *http.Client, cfg *Config) error {
	metrics := collectMetrics()
	body, _ := json.Marshal(heartbeatPayload{
		ServerID: cfg.ServerID,
		CPU:      metrics.CPU,
		Memory:   metrics.Memory,
		Disk:     metrics.Disk,
		Load:     metrics.Load,
		Uptime:   metrics.Uptime,
		Runtime:  cfg.Runtime,
		Metrics: model.MetricsSnapshot{
			CPU:     []float64{metrics.CPU},
			Memory:  []float64{metrics.Memory},
			Disk:    []float64{metrics.Disk},
			Network: []float64{0},
		},
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cfg.ServerURL+"/api/node-agent/heartbeat", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	setAuth(req, cfg)

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("heartbeat: %s: %s", resp.Status, string(raw))
	}
	return nil
}

// metricSnapshot is the raw collected sample.
type metricSnapshot struct {
	CPU     float64
	Memory  float64
	Disk    float64
	Load    float64
	Uptime  int64
}

func collectMetrics() metricSnapshot {
	return metricSnapshot{
		CPU:    readCPUUsage(),
		Memory: readMemoryUsage(),
		Disk:   readDiskUsage(),
		Load:   readLoadAvg(),
		Uptime: time.Now().Unix() - startTime,
	}
}

var startTime = time.Now().Unix()

// ---------------------------------------------------------------------------
// Task polling & execution

func pollTasks(ctx context.Context, client *http.Client, cfg *Config) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api/node-agent/tasks?server_id=%d", cfg.ServerURL, cfg.ServerID), nil)
	if err != nil {
		return err
	}
	setAuth(req, cfg)

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("tasks: %s", resp.Status)
	}

	var tasks []*model.NodeTask
	if err := json.NewDecoder(resp.Body).Decode(&tasks); err != nil {
		return err
	}

	for _, task := range tasks {
		go func(task *model.NodeTask) {
			result, err := executeTask(ctx, task)
			status := model.NodeTaskStatusSuccess
			if err != nil {
				status = model.NodeTaskStatusFailed
				result = err.Error()
			}
			reportTaskResult(ctx, client, cfg, task.ID, status, result)
		}(task)
	}
	return nil
}

func reportTaskResult(ctx context.Context, client *http.Client, cfg *Config, taskID int64, status model.NodeTaskStatus, result string) {
	body, _ := json.Marshal(map[string]string{"status": string(status), "result": result})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("%s/api/node-agent/tasks/%d/result", cfg.ServerURL, taskID), bytes.NewReader(body))
	if err != nil {
		log.Warn().Err(err).Msg("report result: request failed")
		return
	}
	req.Header.Set("Content-Type", "application/json")
	setAuth(req, cfg)
	resp, err := client.Do(req)
	if err != nil {
		log.Warn().Err(err).Msg("report result: post failed")
		return
	}
	_ = resp.Body.Close()
}

// executeTask validates the task against the whitelist and runs the runtime adapter.
func executeTask(ctx context.Context, task *model.NodeTask) (string, error) {
	switch task.Type {
	case "deploy":
		var payload deployPayload
		if err := json.Unmarshal([]byte(task.Payload), &payload); err != nil {
			return "", fmt.Errorf("invalid deploy payload: %w", err)
		}
		if err := validateDeployPayload(payload); err != nil {
			return "", err
		}
		return runDeploy(ctx, payload)
	default:
		return "", fmt.Errorf("task type %q not in whitelist", task.Type)
	}
}

// validateDeployPayload enforces the agent-side whitelist: immutable digest,
// no arbitrary commands.
func validateDeployPayload(payload deployPayload) error {
	if payload.Action != "deploy" {
		return fmt.Errorf("action %q not allowed", payload.Action)
	}
	if !strings.HasPrefix(payload.Digest, "sha256:") {
		return fmt.Errorf("refusing deploy without immutable sha256 digest (got %q)", payload.Digest)
	}
	if payload.Image == "" || strings.Contains(payload.Image, " ") {
		return fmt.Errorf("invalid image reference %q", payload.Image)
	}
	return nil
}

// deployPayload mirrors the server-side payload shape.
type deployPayload struct {
	Action      string `json:"action"`
	ServerID    int64  `json:"server_id"`
	ReleaseID   int64  `json:"release_id"`
	Application string `json:"application"`
	Image       string `json:"image"`
	Digest      string `json:"digest"`
	Version     string `json:"version"`
	Runtime     string `json:"runtime"`
	ComposeFile string `json:"compose_file"`
	Service     string `json:"service"`
	HealthPath  string `json:"health_path"`
	Port        int    `json:"port"`
}
