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

// Demo seed: populates the ops control plane with prototype-like demo data
// (servers, groups, applications, environments, releases, deployments, alerts).
package main

import (
	"context"
	"os"
	"time"

	"github.com/rs/zerolog/log"

	"go.woodpecker-ci.org/woodpecker/v3/server/model"
	"go.woodpecker-ci.org/woodpecker/v3/server/store"
	"go.woodpecker-ci.org/woodpecker/v3/server/store/datastore"
)

func main() {
	driver := os.Getenv("WOODPECKER_DATABASE_DRIVER")
	if driver == "" {
		driver = "sqlite3"
	}
	datasource := os.Getenv("WOODPECKER_DATABASE_DATASOURCE")
	if datasource == "" {
		log.Fatal().Msg("WOODPECKER_DATABASE_DATASOURCE is required")
	}

	s, err := datastore.NewEngine(&store.Opts{Driver: driver, Config: datasource})
	if err != nil {
		log.Fatal().Err(err).Msg("open datastore")
	}
	ctx := context.Background()
	if err := s.Migrate(ctx, false); err != nil {
		log.Fatal().Err(err).Msg("migrate")
	}

	now := nowUnix()

	// Environments
	envs := []*model.Environment{
		{OrgID: 1, Name: "production", Title: "Production", Protected: true, ApprovalRequired: true, MinimumApprovers: 1, AutoRollback: true, DeployWindow: "Mon–Fri 09:00–18:00", Domain: "*.acme.example", Color: "danger"},
		{OrgID: 1, Name: "staging", Title: "Staging", Protected: false, ApprovalRequired: false, AutoRollback: true, DeployWindow: "Any time", Color: "warning"},
		{OrgID: 1, Name: "development", Title: "Development", Protected: false, ApprovalRequired: false, AutoRollback: false, DeployWindow: "Any time", Color: "info"},
	}
	for _, e := range envs {
		_ = s.EnvironmentCreate(e)
	}

	// Server groups
	groups := []*model.ServerGroup{
		{OrgID: 1, EnvironmentID: 1, Name: "prod-api", Description: "Production API nodes in Singapore", Strategy: model.DeployStrategyRolling, BatchSize: 1, HealthPath: "/health/ready", Port: 8080, Labels: map[string]string{"production": "api"}},
		{OrgID: 1, EnvironmentID: 1, Name: "prod-web", Description: "Production web and edge nodes", Strategy: model.DeployStrategyRolling, BatchSize: 1, HealthPath: "/health", Port: 3000, Labels: map[string]string{"production": "web"}},
		{OrgID: 1, EnvironmentID: 2, Name: "staging-shared", Description: "Shared staging application hosts", Strategy: model.DeployStrategyAllAtOnce, BatchSize: 2, HealthPath: "/health", Port: 8080, Labels: map[string]string{"staging": "shared"}},
		{OrgID: 1, EnvironmentID: 1, Name: "prod-workers", Description: "Background workers in Frankfurt", Strategy: model.DeployStrategyRolling, BatchSize: 1, HealthPath: "/health", Port: 9090, Labels: map[string]string{"production": "worker"}},
	}
	for _, g := range groups {
		_ = s.ServerGroupCreate(g)
	}

	// Servers (mirrors the prototype dataset)
	servers := []*model.Server{
		{OrgID: 1, GroupID: 1, EnvironmentID: 1, Name: "prod-api-01", Region: "asia-southeast-1", Zone: "sgp-1a", PrivateIP: "10.20.1.11", OS: "Ubuntu 24.04", Kernel: "6.8.0-40-generic", Runtime: "docker", AgentVersion: "1.2.0", Status: model.ServerStatusOnline, Health: model.ServerHealthHealthy, CPU: 31, Memory: 48, Disk: 62, Load: 1.24, LastHeartbeat: now - 5, CurrentReleaseID: 1, Labels: map[string]string{"production": "api"}, Metrics: model.MetricsSnapshot{CPU: []float64{22, 28, 25, 31, 36, 29, 33, 31, 27, 34, 32, 31}, Memory: []float64{43, 44, 45, 44, 46, 47, 48, 48, 49, 48, 47, 48}, Disk: []float64{58, 58, 59, 59, 60, 60, 60, 61, 61, 61, 62, 62}, Network: []float64{18, 22, 19, 31, 26, 35, 29, 24, 38, 34, 27, 32}}},
		{OrgID: 1, GroupID: 1, EnvironmentID: 1, Name: "prod-api-02", Region: "asia-southeast-1", Zone: "sgp-1b", PrivateIP: "10.20.1.12", OS: "Ubuntu 24.04", Kernel: "6.8.0-40-generic", Runtime: "docker", AgentVersion: "1.2.0", Status: model.ServerStatusOnline, Health: model.ServerHealthWarning, CPU: 72, Memory: 81, Disk: 86, Load: 3.92, LastHeartbeat: now - 7, CurrentReleaseID: 1, Labels: map[string]string{"production": "api"}, Metrics: model.MetricsSnapshot{CPU: []float64{42, 51, 48, 63, 58, 71, 68, 74, 69, 76, 73, 72}, Memory: []float64{62, 65, 68, 69, 73, 75, 77, 79, 80, 81, 82, 81}, Disk: []float64{80, 81, 81, 82, 82, 83, 84, 84, 85, 85, 86, 86}, Network: []float64{26, 31, 33, 42, 38, 47, 45, 39, 52, 48, 43, 46}}},
		{OrgID: 1, GroupID: 1, EnvironmentID: 1, Name: "prod-api-03", Region: "asia-southeast-1", Zone: "sgp-1c", PrivateIP: "10.20.1.13", OS: "Ubuntu 24.04", Kernel: "6.8.0-39-generic", Runtime: "docker", AgentVersion: "1.1.4", Status: model.ServerStatusOffline, Health: model.ServerHealthCritical, Disk: 67, LastHeartbeat: now - 180, Labels: map[string]string{"production": "api"}},
		{OrgID: 1, GroupID: 2, EnvironmentID: 1, Name: "prod-web-01", Region: "asia-southeast-1", Zone: "sgp-1a", PrivateIP: "10.20.2.11", OS: "Debian 13", Kernel: "6.12.8-amd64", Runtime: "docker", AgentVersion: "1.2.0", Status: model.ServerStatusOnline, Health: model.ServerHealthHealthy, CPU: 24, Memory: 39, Disk: 44, Load: 0.86, LastHeartbeat: now - 4, Labels: map[string]string{"production": "web"}},
		{OrgID: 1, GroupID: 2, EnvironmentID: 1, Name: "prod-web-02", Region: "asia-southeast-1", Zone: "sgp-1b", PrivateIP: "10.20.2.12", OS: "Debian 13", Kernel: "6.12.8-amd64", Runtime: "docker", AgentVersion: "1.2.0", Status: model.ServerStatusMaintenance, Health: model.ServerHealthMaintenance, CPU: 8, Memory: 22, Disk: 49, Load: 0.18, LastHeartbeat: now - 6, Maintenance: true, Labels: map[string]string{"production": "web"}},
		{OrgID: 1, GroupID: 3, EnvironmentID: 2, Name: "staging-all-01", Region: "asia-southeast-1", Zone: "sgp-1a", PrivateIP: "10.30.1.11", OS: "Ubuntu 24.04", Kernel: "6.8.0-40-generic", Runtime: "docker", AgentVersion: "1.2.0", Status: model.ServerStatusOnline, Health: model.ServerHealthWarning, CPU: 54, Memory: 63, Disk: 51, Load: 2.21, LastHeartbeat: now - 9, Labels: map[string]string{"staging": "shared"}},
		{OrgID: 1, GroupID: 3, EnvironmentID: 2, Name: "staging-all-02", Region: "asia-southeast-1", Zone: "sgp-1b", PrivateIP: "10.30.1.12", OS: "Ubuntu 24.04", Kernel: "6.8.0-40-generic", Runtime: "docker", AgentVersion: "1.2.0", Status: model.ServerStatusOnline, Health: model.ServerHealthHealthy, CPU: 21, Memory: 34, Disk: 37, Load: 0.66, LastHeartbeat: now - 8, Labels: map[string]string{"staging": "shared"}},
		{OrgID: 1, GroupID: 4, EnvironmentID: 1, Name: "prod-worker-01", Region: "eu-west-1", Zone: "fra-1a", PrivateIP: "10.40.1.11", OS: "Ubuntu 24.04", Kernel: "6.8.0-40-generic", Runtime: "docker", AgentVersion: "1.2.0", Status: model.ServerStatusOnline, Health: model.ServerHealthHealthy, CPU: 43, Memory: 58, Disk: 46, Load: 1.76, LastHeartbeat: now - 5, Labels: map[string]string{"production": "worker"}},
	}
	for _, srv := range servers {
		_ = s.ServerCreate(srv)
	}

	// Applications
	apps := []*model.Application{
		{OrgID: 1, RepoID: 101, Name: "backend-api", Description: "Customer and internal API service", Image: "ghcr.io/acme/backend-api", Runtime: "docker-compose", ComposeFile: "deploy/docker-compose.yml", Service: "api", HealthPath: "/health/ready", Port: 8080, OwnerTeam: "Platform"},
		{OrgID: 1, RepoID: 102, Name: "web-frontend", Description: "Vue customer web application", Image: "ghcr.io/acme/web-frontend", Runtime: "docker-compose", ComposeFile: "deploy/docker-compose.yml", Service: "web", HealthPath: "/health", Port: 3000, OwnerTeam: "Frontend"},
		{OrgID: 1, RepoID: 103, Name: "worker-service", Description: "Asynchronous background workers", Image: "ghcr.io/acme/worker-service", Runtime: "docker-compose", ComposeFile: "deploy/worker.compose.yml", Service: "worker", HealthPath: "/health", Port: 9090, OwnerTeam: "Backend"},
		{OrgID: 1, RepoID: 112, Name: "notification-service", Description: "Email, SMS and webhook delivery", Image: "ghcr.io/acme/notification-service", Runtime: "systemd", Service: "notification", HealthPath: "/ready", Port: 8080, OwnerTeam: "Backend"},
	}
	for _, a := range apps {
		_ = s.ApplicationCreate(a)
	}

	// Releases
	releases := []*model.AppRelease{
		{OrgID: 1, ApplicationID: 1, PipelineID: 841, Version: "v1.4.1-rc.2", Commit: "d4e5f6a", Digest: "sha256:8dcf1c3a9d01", Image: "ghcr.io/acme/backend-api", Author: "bob", Status: model.AppReleaseStatusReady},
		{OrgID: 1, ApplicationID: 1, PipelineID: 837, Version: "v1.4.0", Commit: "b2c3d4e", Digest: "sha256:1ee6d72a21a8", Image: "ghcr.io/acme/backend-api", Author: "erin", Status: model.AppReleaseStatusDeployed},
		{OrgID: 1, ApplicationID: 2, PipelineID: 892, Version: "v3.8.2", Commit: "9f8a7b6", Digest: "sha256:486b9c4e02aa", Image: "ghcr.io/acme/web-frontend", Author: "alice", Status: model.AppReleaseStatusDeployed},
		{OrgID: 1, ApplicationID: 3, PipelineID: 888, Version: "v2.6.0", Commit: "4c3b2a1", Digest: "sha256:c511d8ab7c93", Image: "ghcr.io/acme/worker-service", Author: "dave", Status: model.AppReleaseStatusDeployed},
		{OrgID: 1, ApplicationID: 2, PipelineID: 896, Version: "v3.9.0-beta.1", Commit: "ca12fe3", Digest: "sha256:6972f1cc0b8a", Image: "ghcr.io/acme/web-frontend", Author: "carol", Status: model.AppReleaseStatusReady},
		{OrgID: 1, ApplicationID: 3, PipelineID: 895, Version: "v2.7.0-rc.1", Commit: "7d6c5b4", Digest: "sha256:76fc2d8149ea", Image: "ghcr.io/acme/worker-service", Author: "dave", Status: model.AppReleaseStatusReady},
		{OrgID: 1, ApplicationID: 4, PipelineID: 884, Version: "v1.9.3", Commit: "1029abc", Digest: "sha256:3bc09911fe4d", Image: "ghcr.io/acme/notification-service", Author: "frank", Status: model.AppReleaseStatusDeployed},
		{OrgID: 1, ApplicationID: 4, PipelineID: 897, Version: "v2.0.0-rc.1", Commit: "f3e2d1c", Digest: "sha256:1b6217c350bf", Image: "ghcr.io/acme/notification-service", Author: "frank", Status: model.AppReleaseStatusReady},
	}
	for _, r := range releases {
		_ = s.AppReleaseCreate(r)
	}

	// Deployments (one completed, one running, one awaiting approval)
	d1 := &model.Deployment{OrgID: 1, ApplicationID: 2, EnvironmentID: 1, ReleaseID: 3, PipelineID: 892, GroupID: 2, Strategy: model.DeployStrategyRolling, BatchSize: 1, Status: model.DeploymentStatusSuccess, Progress: 100, TriggeredBy: "alice", ApprovedBy: "mike", StartedAt: now - 3600, FinishedAt: now - 3500}
	d1.Logs = []model.DeploymentLog{
		{At: now - 3600, Level: "info", Message: "Deployment created by alice targeting release v3.8.2"},
		{At: now - 3600, Level: "info", Message: "Deployment started"},
		{At: now - 3590, Level: "info", Message: "prod-web-01: deploying v3.8.2 (sha256:486b9c4e)"},
		{At: now - 3550, Level: "success", Message: "prod-web-01: healthy"},
		{At: now - 3540, Level: "info", Message: "prod-web-02: skipped (maintenance)"},
		{At: now - 3500, Level: "success", Message: "Deployment completed"},
	}
	_ = s.DeploymentCreate(d1)
	_ = s.DeploymentTargetUpsert(&model.DeploymentTarget{DeploymentID: d1.ID, ServerID: 4, Status: model.TargetStatusHealthy, Phase: "healthy", Message: "Health check passed", StartedAt: now - 3590, FinishedAt: now - 3550})
	_ = s.DeploymentTargetUpsert(&model.DeploymentTarget{DeploymentID: d1.ID, ServerID: 5, Status: model.TargetStatusSkipped, Phase: "waiting", Message: "server in maintenance mode", StartedAt: now - 3590, FinishedAt: now - 3590})

	d2 := &model.Deployment{OrgID: 1, ApplicationID: 1, EnvironmentID: 1, ReleaseID: 1, PreviousReleaseID: 2, PipelineID: 841, GroupID: 1, Strategy: model.DeployStrategyRolling, BatchSize: 1, Status: model.DeploymentStatusPendingApproval, TriggeredBy: "alice", StartedAt: 0}
	d2.Logs = []model.DeploymentLog{
		{At: now - 600, Level: "info", Message: "Deployment created by alice targeting release v1.4.1-rc.2"},
		{At: now - 600, Level: "warning", Message: "Awaiting 1 approval(s) for production"},
	}
	_ = s.DeploymentCreate(d2)
	_ = s.DeploymentTargetUpsert(&model.DeploymentTarget{DeploymentID: d2.ID, ServerID: 1, Status: model.TargetStatusQueued, Phase: "waiting"})
	_ = s.DeploymentTargetUpsert(&model.DeploymentTarget{DeploymentID: d2.ID, ServerID: 2, Status: model.TargetStatusQueued, Phase: "waiting"})
	_ = s.DeploymentTargetUpsert(&model.DeploymentTarget{DeploymentID: d2.ID, ServerID: 3, Status: model.TargetStatusQueued, Phase: "waiting"})

	d3 := &model.Deployment{OrgID: 1, ApplicationID: 3, EnvironmentID: 1, ReleaseID: 4, PipelineID: 888, GroupID: 4, Strategy: model.DeployStrategyRolling, BatchSize: 1, Status: model.DeploymentStatusRunning, Progress: 50, TriggeredBy: "alice", ApprovedBy: "mike", StartedAt: now - 300}
	d3.Logs = []model.DeploymentLog{
		{At: now - 300, Level: "info", Message: "Deployment created by alice targeting release v2.6.0"},
		{At: now - 300, Level: "info", Message: "Deployment started"},
		{At: now - 290, Level: "info", Message: "prod-worker-01: deploying v2.6.0 (sha256:c511d8ab)"},
	}
	_ = s.DeploymentCreate(d3)
	_ = s.DeploymentTargetUpsert(&model.DeploymentTarget{DeploymentID: d3.ID, ServerID: 8, Status: model.TargetStatusDeploying, Phase: "pulling", StartedAt: now - 290})

	// Alerts
	alerts := []*model.Alert{
		{OrgID: 1, Type: "server_offline", Severity: "critical", Status: model.AlertStatusActive, ServerID: 3, Message: "prod-api-03 Node Agent heartbeat lost (offline 3m)"},
		{OrgID: 1, Type: "disk", Severity: "warning", Status: model.AlertStatusActive, ServerID: 2, Message: "prod-api-02 disk usage at 86%"},
		{OrgID: 1, Type: "cpu", Severity: "warning", Status: model.AlertStatusActive, ServerID: 2, Message: "prod-api-02 CPU sustained above 70%"},
		{OrgID: 1, Type: "container_restart", Severity: "info", Status: model.AlertStatusAcknowledged, ServerID: 6, Message: "staging-all-01 api container restarted 3 times in 24h", AcknowledgedBy: "alice"},
		{OrgID: 1, Type: "deployment_failed", Severity: "warning", Status: model.AlertStatusResolved, DeploymentID: d1.ID, Message: "prod-web-02 skipped during deployment DEP-1", ResolvedBy: "alice", ResolvedAt: now - 3300},
	}
	for _, a := range alerts {
		_ = s.AlertCreate(a)
	}

	log.Info().Msg("demo data seeded")
}

func nowUnix() int64 {
	return time.Now().Unix()
}
