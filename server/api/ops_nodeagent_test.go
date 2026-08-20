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
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go.woodpecker-ci.org/woodpecker/v3/server"
)

func TestRequireNodeAgentAllowsBootstrapRegistrationWithSecret(t *testing.T) {
	original := server.Config.Server.NodeAgentToken
	server.Config.Server.NodeAgentToken = "node-agent-test-secret"
	t.Cleanup(func() {
		server.Config.Server.NodeAgentToken = original
	})

	router := gin.New()
	router.POST("/api/node-agent/register", RequireNodeAgent(), func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	request := httptest.NewRequest(http.MethodPost, "/api/node-agent/register", nil)
	request.Header.Set("Authorization", "Bearer node-agent-test-secret")
	request.Header.Set("X-Node-Agent-Server-Id", "0")
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	assert.Equal(t, http.StatusNoContent, response.Code)
}

func TestRequireNodeAgentRejectsInvalidBootstrapAndNonRegisterRequests(t *testing.T) {
	original := server.Config.Server.NodeAgentToken
	server.Config.Server.NodeAgentToken = "node-agent-test-secret"
	t.Cleanup(func() {
		server.Config.Server.NodeAgentToken = original
	})

	tests := []struct {
		name  string
		path  string
		token string
		want  int
	}{
		{name: "missing secret", path: "/api/node-agent/register", token: "", want: http.StatusUnauthorized},
		{name: "wrong secret", path: "/api/node-agent/register", token: "wrong", want: http.StatusUnauthorized},
		{name: "bootstrap heartbeat", path: "/api/node-agent/heartbeat", token: "node-agent-test-secret", want: http.StatusUnauthorized},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.POST("/api/node-agent/register", RequireNodeAgent(), func(c *gin.Context) {
				c.Status(http.StatusNoContent)
			})
			router.POST("/api/node-agent/heartbeat", RequireNodeAgent(), func(c *gin.Context) {
				c.Status(http.StatusNoContent)
			})

			request := httptest.NewRequest(http.MethodPost, tt.path, nil)
			if tt.token != "" {
				request.Header.Set("Authorization", "Bearer "+tt.token)
			}
			request.Header.Set("X-Node-Agent-Server-Id", "0")
			response := httptest.NewRecorder()

			router.ServeHTTP(response, request)

			require.Equal(t, tt.want, response.Code)
		})
	}
}
