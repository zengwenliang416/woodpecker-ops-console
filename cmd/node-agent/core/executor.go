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
	"context"
	"fmt"
	"net/http"
	"os/exec"
	"time"
)

// runDeploy executes the rollout for a validated payload using the runtime
// adapter (docker-compose / kubernetes / systemd), then probes health.
func runDeploy(ctx context.Context, payload deployPayload) (string, error) {
	switch payload.Runtime {
	case "docker", "docker-compose", "":
		if err := dockerDeploy(ctx, payload); err != nil {
			return "", err
		}
	case "systemd":
		if err := systemdDeploy(ctx, payload); err != nil {
			return "", err
		}
	case "kubernetes", "k8s":
		if err := kubernetesDeploy(ctx, payload); err != nil {
			return "", err
		}
	default:
		return "", fmt.Errorf("unsupported runtime %q", payload.Runtime)
	}

	if err := healthProbe(ctx, payload); err != nil {
		return "", fmt.Errorf("health check failed: %w", err)
	}
	return fmt.Sprintf("deployed %s@%s to server %d (%s)", payload.Image, payload.Digest[:19], payload.ServerID, payload.Runtime), nil
}

// dockerDeploy pulls the immutable digest and restarts the compose service.
func dockerDeploy(ctx context.Context, payload deployPayload) error {
	imageRef := fmt.Sprintf("%s@%s", payload.Image, payload.Digest)
	if out, err := exec.CommandContext(ctx, "docker", "pull", imageRef).CombinedOutput(); err != nil {
		return fmt.Errorf("docker pull %s: %w: %s", imageRef, err, string(out))
	}
	if payload.ComposeFile != "" {
		if out, err := exec.CommandContext(ctx, "docker", "compose", "-f", payload.ComposeFile, "up", "-d", payload.Service).CombinedOutput(); err != nil {
			return fmt.Errorf("docker compose up: %w: %s", err, string(out))
		}
		return nil
	}
	// Plain container restart fallback.
	if out, err := exec.CommandContext(ctx, "docker", "restart", payload.Service).CombinedOutput(); err != nil {
		return fmt.Errorf("docker restart: %w: %s", err, string(out))
	}
	return nil
}

// systemdDeploy restarts the service unit.
func systemdDeploy(ctx context.Context, payload deployPayload) error {
	unit := payload.Service
	if unit == "" {
		unit = payload.Application
	}
	if out, err := exec.CommandContext(ctx, "systemctl", "restart", unit).CombinedOutput(); err != nil {
		return fmt.Errorf("systemctl restart %s: %w: %s", unit, err, string(out))
	}
	return nil
}

// kubernetesDeploy applies the manifest (digest injected via env at runtime).
func kubernetesDeploy(ctx context.Context, payload deployPayload) error {
	if payload.ComposeFile == "" {
		return fmt.Errorf("kubernetes deploy requires a manifest file (compose_file)")
	}
	if out, err := exec.CommandContext(ctx, "kubectl", "apply", "-f", payload.ComposeFile).CombinedOutput(); err != nil {
		return fmt.Errorf("kubectl apply: %w: %s", err, string(out))
	}
	if out, err := exec.CommandContext(ctx, "kubectl", "rollout", "status", "deployment/"+payload.Service).CombinedOutput(); err != nil {
		return fmt.Errorf("kubectl rollout status: %w: %s", err, string(out))
	}
	return nil
}

// healthProbe polls GET http://127.0.0.1:{port}{health_path} with retries.
func healthProbe(ctx context.Context, payload deployPayload) error {
	path := payload.HealthPath
	if path == "" {
		path = "/health"
	}
	port := payload.Port
	if port == 0 {
		port = 8080
	}
	url := fmt.Sprintf("http://127.0.0.1:%d%s", port, path)
	client := &http.Client{Timeout: 3 * time.Second}
	var lastErr error
	for attempt := 1; attempt <= 5; attempt++ {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}
		resp, err := client.Get(url)
		if err == nil {
			_ = resp.Body.Close()
			if resp.StatusCode >= 200 && resp.StatusCode < 500 {
				return nil
			}
			lastErr = fmt.Errorf("health probe %s returned %s", url, resp.Status)
		} else {
			lastErr = err
		}
		time.Sleep(2 * time.Second)
	}
	return lastErr
}
