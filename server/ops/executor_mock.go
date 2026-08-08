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
	"fmt"
	"math/rand"
	"time"

	"go.woodpecker-ci.org/woodpecker/v3/server/model"
)

// MockExecutor simulates rollout actions so the full deployment control plane
// can be exercised without real infrastructure. It mirrors the failure
// injection rules of the functional prototype: maintenance and offline
// servers are skipped by the engine before reaching the executor, and a
// configurable failure rate simulates flaky nodes.
type MockExecutor struct {
	// FailureRate (0..1) simulates random deploy/health-check failures.
	FailureRate float64

	// DeployDuration / HealthCheckDuration control the simulated latency.
	DeployDuration       time.Duration
	HealthCheckDuration  time.Duration
}

// NewMockExecutor returns a MockExecutor with prototype-like timings.
func NewMockExecutor() *MockExecutor {
	return &MockExecutor{
		FailureRate:         0.05,
		DeployDuration:      2 * time.Second,
		HealthCheckDuration: 1500 * time.Millisecond,
	}
}

// Deploy simulates pulling the image and starting the workload.
func (m *MockExecutor) Deploy(ctx context.Context, _ model.DeploymentTarget, release model.AppRelease, app model.Application, server model.Server) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(m.DeployDuration):
	}

	if rand.Float64() < m.FailureRate { //nolint:gosec // mock only
		return fmt.Errorf("image pull failed for %s:%s on %s", app.Image, release.Version, server.Name)
	}
	return nil
}

// HealthCheck simulates the HTTP health probe with retries.
func (m *MockExecutor) HealthCheck(ctx context.Context, _ model.Server, _ model.Application) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(m.HealthCheckDuration):
	}

	if rand.Float64() < m.FailureRate { //nolint:gosec // mock only
		return fmt.Errorf("health check timed out after 3 attempts")
	}
	return nil
}
