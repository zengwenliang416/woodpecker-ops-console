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

package ops

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"go.woodpecker-ci.org/woodpecker/v3/server/model"
	"go.woodpecker-ci.org/woodpecker/v3/server/store"
)

// deployPayload is the structured, signed task payload executed by a Node Agent.
type deployPayload struct {
	Action      string            `json:"action"` // deploy
	ServerID    int64             `json:"server_id"`
	ReleaseID   int64             `json:"release_id"`
	Application string            `json:"application"`
	Image       string            `json:"image"`
	Digest      string            `json:"digest"`
	Version     string            `json:"version"`
	Runtime     string            `json:"runtime"` // docker | kubernetes | systemd
	ComposeFile string            `json:"compose_file"`
	Service     string            `json:"service"`
	HealthPath  string            `json:"health_path"`
	Port        int               `json:"port"`
	Labels      map[string]string `json:"labels"`
}

// NodeAgentExecutor dispatches signed tasks to Node Agents via the node_tasks
// table and waits for the agent to report the result. The engine state machine
// stays unchanged: swapping the executor switches from simulated to real rollout.
type NodeAgentExecutor struct {
	store      store.Store
	PollEvery  time.Duration
	TaskTimeout time.Duration
}

// NewNodeAgentExecutor creates an executor that dispatches real rollout tasks.
func NewNodeAgentExecutor(s store.Store) *NodeAgentExecutor {
	return &NodeAgentExecutor{
		store:       s,
		PollEvery:   2 * time.Second,
		TaskTimeout: 10 * time.Minute,
	}
}

// Deploy creates a signed deploy task for the node and waits for completion.
func (e *NodeAgentExecutor) Deploy(ctx context.Context, target model.DeploymentTarget, release model.AppRelease, app model.Application, server model.Server) error {
	payload, err := json.Marshal(deployPayload{
		Action:      "deploy",
		ServerID:    server.ID,
		ReleaseID:   release.ID,
		Application: app.Name,
		Image:       app.Image,
		Digest:      release.Digest,
		Version:     release.Version,
		Runtime:     app.Runtime,
		ComposeFile: app.ComposeFile,
		Service:     app.Service,
		HealthPath:  app.HealthPath,
		Port:        app.Port,
		Labels:      server.Labels,
	})
	if err != nil {
		return err
	}

	task := &model.NodeTask{
		ServerID:     server.ID,
		Type:         "deploy",
		Payload:      string(payload),
		Status:       model.NodeTaskStatusPending,
		DeploymentID: target.DeploymentID,
	}
	if err := e.store.NodeTaskCreate(task); err != nil {
		return err
	}

	return e.waitForResult(ctx, task.ID)
}

// HealthCheck is performed by the Node Agent as part of the deploy task;
// the engine marks targets healthy after a successful task. This stub keeps
// the Executor interface satisfied.
func (e *NodeAgentExecutor) HealthCheck(context.Context, model.Server, model.Application) error {
	return nil
}

func (e *NodeAgentExecutor) waitForResult(ctx context.Context, taskID int64) error {
	deadline := time.Now().Add(e.TaskTimeout)
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}
		if time.Now().After(deadline) {
			return fmt.Errorf("node agent task %d timed out", taskID)
		}

		task, err := e.store.NodeTaskGet(taskID)
		if err != nil {
			return err
		}
		switch task.Status {
		case model.NodeTaskStatusSuccess:
			return nil
		case model.NodeTaskStatusFailed:
			return fmt.Errorf("node agent deploy failed: %s", task.Result)
		}

		time.Sleep(e.PollEvery)
	}
}
