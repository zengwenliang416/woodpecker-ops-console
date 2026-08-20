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

package main

import (
	"context"
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/urfave/cli/v3"

	"go.woodpecker-ci.org/woodpecker/v3/cmd/node-agent/core"
	"go.woodpecker-ci.org/woodpecker/v3/shared/utils"
)

func main() {
	zerolog.SetGlobalLevel(zerolog.InfoLevel)

	cmd := &cli.Command{
		Name:  "woodpecker-node-agent",
		Usage: "Woodpecker Node Agent: reports server metrics and executes signed rollout actions",
		Flags: []cli.Flag{
			&cli.StringFlag{Name: "server", Usage: "Woodpecker server URL", Required: true, Sources: cli.EnvVars("WOODPECKER_SERVER")},
			&cli.StringFlag{Name: "name", Usage: "Server name registered on the control plane", Required: true, Sources: cli.EnvVars("WOODPECKER_NODE_NAME")},
			&cli.Int64Flag{Name: "server-id", Usage: "Node Agent server id (returned at registration)", Sources: cli.EnvVars("WOODPECKER_NODE_SERVER_ID")},
				&cli.Int64Flag{Name: "org-id", Usage: "Organization id", Sources: cli.EnvVars("WOODPECKER_NODE_ORG_ID")},
			&cli.StringFlag{Name: "agent-token", Usage: "Node Agent bearer token", Sources: cli.EnvVars("WOODPECKER_NODE_AGENT_TOKEN")},
			&cli.BoolFlag{Name: "insecure", Usage: "Skip TLS verification", Sources: cli.EnvVars("WOODPECKER_NODE_INSECURE")},
			&cli.IntFlag{Name: "heartbeat-interval", Usage: "Heartbeat interval in seconds", Value: 5, Sources: cli.EnvVars("WOODPECKER_NODE_HEARTBEAT_INTERVAL")},
			&cli.StringFlag{Name: "runtime", Usage: "Container runtime (docker|kubernetes|systemd)", Value: "docker", Sources: cli.EnvVars("WOODPECKER_NODE_RUNTIME")},
			&cli.BoolFlag{Name: "log-level-debug", Usage: "Enable debug logging", Sources: cli.EnvVars("WOODPECKER_NODE_LOG_LEVEL_DEBUG")},
		},
		Action: func(ctx context.Context, c *cli.Command) error {
			if c.Bool("log-level-debug") {
				zerolog.SetGlobalLevel(zerolog.DebugLevel)
			}
			cfg := &core.Config{
				ServerURL:         c.String("server"),
				Name:              c.String("name"),
				ServerID:          c.Int64("server-id"),
				OrgID:             c.Int64("org-id"),
				AgentToken:        c.String("agent-token"),
				Insecure:          c.Bool("insecure"),
				HeartbeatInterval: c.Int("heartbeat-interval"),
				Runtime:           c.String("runtime"),
			}
			runCtx := utils.WithContextSigtermCallback(ctx, func() {
				log.Info().Msg("termination signal received, shutting down node agent")
			})
			return core.Run(runCtx, cfg)
		},
	}

	if err := cmd.Run(context.Background(), os.Args); err != nil {
		log.Fatal().Err(err).Msg("node agent failed")
	}
}
