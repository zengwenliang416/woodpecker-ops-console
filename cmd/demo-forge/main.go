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

// Demo forge: local development / demo-only forge that auto-authenticates a
// fixed admin user. Never use in production.
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/rs/zerolog/log"

	"go.woodpecker-ci.org/woodpecker/v3/server/forge/addon"
	"go.woodpecker-ci.org/woodpecker/v3/server/forge/types"
	"go.woodpecker-ci.org/woodpecker/v3/server/model"
	store_types "go.woodpecker-ci.org/woodpecker/v3/server/store/types"
)

const demoUserLogin = "alice"

type demoForge struct {
	url string
}

func (d *demoForge) Name() string { return "demo" }

func (d *demoForge) URL() string { return d.url }

func (d *demoForge) Login(_ context.Context, r *types.OAuthRequest) (*model.User, string, error) {
	// First step: redirect straight back to the server login callback,
	// carrying the OAuth state token for validation.
	if r.Code == "" {
		return nil, fmt.Sprintf("%s/authorize?code=demo&state=%s", d.url, r.State), nil
	}

	user := &model.User{
		Login:        demoUserLogin,
		Email:        "alice@acme.internal",
		Admin:        true,
		ForgeRemoteID: "demo-alice",
		AccessToken:  "demo-access-token",
		RefreshToken: "demo-refresh-token",
	}
	return user, "", nil
}

func (d *demoForge) Teams(context.Context, *model.User, *model.ListOptions) ([]*model.Team, error) {
	return []*model.Team{}, nil
}

func (d *demoForge) Repo(context.Context, *model.User, model.ForgeRemoteID, string, string) (*model.Repo, error) {
	return nil, store_types.ErrRecordNotExist
}

func (d *demoForge) Repos(context.Context, *model.User, *model.ListOptions) ([]*model.Repo, error) {
	return []*model.Repo{}, nil
}

func (d *demoForge) File(context.Context, *model.User, *model.Repo, *model.Pipeline, string) ([]byte, error) {
	return nil, types.ErrNotImplemented
}

func (d *demoForge) Dir(context.Context, *model.User, *model.Repo, *model.Pipeline, string) ([]*types.FileMeta, error) {
	return nil, types.ErrNotImplemented
}

func (d *demoForge) Status(context.Context, *model.User, *model.Repo, *model.Pipeline, *model.Workflow) error {
	return nil
}

func (d *demoForge) Hook(context.Context, *http.Request) (*model.Repo, *model.Pipeline, error) {
	return nil, nil, types.ErrNotImplemented
}

func (d *demoForge) OrgMembership(context.Context, *model.User, string) (*model.OrgPerm, error) {
	return &model.OrgPerm{Member: true}, nil
}

func (d *demoForge) Netrc(*model.User, *model.Repo) (*model.Netrc, error) {
	return &model.Netrc{}, nil
}

func (d *demoForge) Activate(context.Context, *model.User, *model.Repo, string) error {
	return nil
}

func (d *demoForge) Deactivate(context.Context, *model.User, *model.Repo, string) error {
	return nil
}

func (d *demoForge) Branches(context.Context, *model.User, *model.Repo, *model.ListOptions) ([]string, error) {
	return []string{}, nil
}

func (d *demoForge) BranchHead(context.Context, *model.User, *model.Repo, string) (*model.Commit, error) {
	return nil, types.ErrNotImplemented
}

func (d *demoForge) PullRequests(context.Context, *model.User, *model.Repo, *model.ListOptions) ([]*model.PullRequest, error) {
	return nil, types.ErrNotImplemented
}

func (d *demoForge) PullRequest(context.Context, *model.User, *model.Repo, int) (*model.PullRequest, error) {
	return nil, types.ErrNotImplemented
}

func (d *demoForge) Org(context.Context, *model.User, string) (*model.Org, error) {
	return nil, types.ErrNotImplemented
}

func (d *demoForge) OrgLookup(context.Context, *model.User, string) (*model.Org, error) {
	return nil, types.ErrNotImplemented
}

func (d *demoForge) User(context.Context, *model.User, string) (*model.User, error) {
	return nil, types.ErrNotImplemented
}

func (d *demoForge) ChangeConfig(context.Context, *model.User, *model.Repo, *model.Pipeline, []*types.FileMeta) error {
	return nil
}

func main() {
	url := strings.TrimRight(os.Getenv("WOODPECKER_DEMO_FORGE_URL"), "/")
	if url == "" {
		url = "http://localhost:8000"
	}
	log.Info().Str("url", url).Msg("starting demo forge")
	addon.Serve(&demoForge{url: url})
}
