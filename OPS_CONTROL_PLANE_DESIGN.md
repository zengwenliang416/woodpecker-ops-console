# Woodpecker 运维与部署控制面 · 落地设计文档

> 目标：将 `woodpecker-functional-prototype-with-ops/` 原型（67 个页面状态、60 条路由）**完整落地**到当前 woodpecker v3 项目。
> 原型定位：`go.woodpecker-ci.org/woodpecker/v3`（Go 后端 + Vue 3 前端 + 原生 Build Agent）。
> 本文档为实施基线：模型、API、引擎、Node Agent、前端均按可直接编码的粒度给出。

---

## 1. 总体结论

| 原型路由 | 覆盖内容 | 当前项目现状 | 落地性质 |
|---|---|---|---|
| #1–45 | CI/CD（仓库/流水线/日志/Secret/Agent/管理后台） | ✅ `web/src/views/` 与 `server/api/` 已全部具备 | **视觉换皮**（不动后端） |
| #46–57 | 基础设施运维（服务器/监控/告警/服务器组/服务容器） | ❌ 不存在 | **从零建设**（模型+API+Node Agent+前端） |
| #58–67 | 部署控制面（应用/环境/Release/部署向导/审批/回滚） | ❌ 不存在 | **从零建设**（模型+API+引擎+前端） |

**结论：能完整实现。** 后端全部新能力集中在 `server/model` + `server/store/datastore` + `server/api` + `server/router/api.go` 四处，遵循现有 xorm + gin 模式；前端遵循现有 `views/` + `compositions/` + `lib/api/` + Pinia 模式。实时能力复用现有 `server/pubsub` 与 `server/api/stream.go`。

---

## 2. 总体架构

```text
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Web (Vue 3 + TS + Vite)    │  REST  │  Woodpecker Server (Go/gin)  │
│  views/infrastructure/      │◄──────►│  server/api/ops/*            │
│  views/deployments/         │  SSE   │  server/pubsub (Topics)      │
│  store/servers|deployments  │◄──────►│  server/ops/engine           │
└─────────────────────────────┘        └──────────────┬───────────────┘
                                                       │ mTLS + 签名动作
                                ┌──────────────────────┼──────────────────────┐
                                │                      │                      │
                    ┌───────────▼──────────┐  ┌────────▼─────────┐  ┌────────▼─────────┐
                    │  Build Agent (已有)   │  │  Node Agent (新)  │  │  Forge (已有)     │
                    │  测试/构建/生成 Release│  │  心跳/指标/执行部署 │  │  GitHub/Gitea...  │
                    └──────────────────────┘  └────────┬─────────┘  └──────────────────┘
                                                       │ docker / kubernetes / systemd
                                               ┌───────▼────────┐
                                               │ 生产/预发服务器 │
                                               └────────────────┘
```

**角色边界（沿用原型设计，安全关键）**
- Build Agent：只负责测试、构建、产出镜像与 Release，**不持有生产服务器权限**。
- Node Agent：负责上报状态与执行**结构化、签名、白名单内**的部署动作，不接受任意 Shell。
- Controller（Server 侧新模块 `server/ops/`）：编排 Deployment 状态机、审批、审计。
- 浏览器：永不获得 SSH 私钥或生产 Secret。

---

## 3. 数据模型（新增 10 张表）

全部放在 `server/model/`，xorm tag 风格与现有 `agent.go` 一致；迁移追加到 `server/store/datastore/migration/`（xormigrate）。

### 3.1 `servers` — 节点服务器（Node Agent 注册）

```go
type Server struct {
    ID                int64             `json:"id" xorm:"pk autoincr 'id'"`
    Created           int64             `json:"created" xorm:"created"`
    Updated           int64             `json:"updated" xorm:"updated"`
    OrgID             int64             `json:"org_id" xorm:"INDEX 'org_id'"`
    GroupID           int64             `json:"group_id" xorm:"INDEX 'group_id'"`
    EnvironmentID     int64             `json:"environment_id" xorm:"INDEX 'environment_id'"`
    Name              string            `json:"name" xorm:"UNIQUE 'name'"`
    Region            string            `json:"region" xorm:"VARCHAR(64)"`
    Zone              string            `json:"zone" xorm:"VARCHAR(64)"`
    PrivateIP         string            `json:"private_ip" xorm:"VARCHAR(64)"`
    PublicIP          string            `json:"public_ip" xorm:"VARCHAR(64)"`
    OS                string            `json:"os" xorm:"VARCHAR(100)"`
    Kernel            string            `json:"kernel" xorm:"VARCHAR(100)"`
    Runtime           string            `json:"runtime" xorm:"VARCHAR(32)"`  // docker|kubernetes|systemd
    AgentVersion      string            `json:"agent_version" xorm:"VARCHAR(32)"`
    CertSerial        string            `json:"cert_serial" xorm:"VARCHAR(128)"` // mTLS 证书序列号
    Status            string            `json:"status" xorm:"VARCHAR(16)"`       // online|offline|maintenance
    Health            string            `json:"health" xorm:"VARCHAR(16)"`       // healthy|warning|critical
    CPU               float64           `json:"cpu" xorm:"FLOAT"`
    Memory            float64           `json:"memory" xorm:"FLOAT"`
    Disk              float64           `json:"disk" xorm:"FLOAT"`
    Load              float64           `json:"load" xorm:"FLOAT"`
    UptimeSeconds     int64             `json:"uptime_seconds"`
    LastHeartbeat     int64             `json:"last_heartbeat" xorm:"INDEX"`
    CurrentReleaseID  int64             `json:"current_release_id"`
    Maintenance       bool              `json:"maintenance"`
    Labels            map[string]string `json:"labels" xorm:"JSON 'labels'"`
    Metrics           MetricsSnapshot   `json:"metrics" xorm:"JSON 'metrics'"`   // 最近 12 个采样点（对齐原型）
}

type MetricsSnapshot struct {
    CPU     []float64 `json:"cpu"`
    Memory  []float64 `json:"memory"`
    Disk    []float64 `json:"disk"`
    Network []float64 `json:"network"`
}
```

### 3.2 `server_groups` — 服务器组（含部署默认策略）

```go
type ServerGroup struct {
    ID            int64             `json:"id" xorm:"pk autoincr 'id'"`
    Created       int64             `json:"created" xorm:"created"`
    Updated       int64             `json:"updated" xorm:"updated"`
    OrgID         int64             `json:"org_id" xorm:"INDEX 'org_id'"`
    EnvironmentID int64             `json:"environment_id" xorm:"INDEX 'environment_id'"`
    Name          string            `json:"name" xorm:"UNIQUE 'name'"`
    Description   string            `json:"description" xorm:"VARCHAR(255)"`
    Strategy      string            `json:"strategy" xorm:"VARCHAR(16)"`  // single|all-at-once|rolling
    BatchSize     int               `json:"batch_size"`
    HealthPath    string            `json:"health_path" xorm:"VARCHAR(255)"`
    Port          int               `json:"port"`
    Labels        map[string]string `json:"labels" xorm:"JSON 'labels'"`
}
```

### 3.3 `applications` — 应用（关联 CI 仓库与镜像）

```go
type Application struct {
    ID          int64  `json:"id" xorm:"pk autoincr 'id'"`
    Created     int64  `json:"created" xorm:"created"`
    Updated     int64  `json:"updated" xorm:"updated"`
    OrgID       int64  `json:"org_id" xorm:"INDEX 'org_id'"`
    RepoID      int64  `json:"repo_id" xorm:"INDEX 'repo_id'"`   // 关联 CI 仓库，可空
    Name        string `json:"name" xorm:"UNIQUE 'name'"`
    Description string `json:"description" xorm:"VARCHAR(255)"`
    Image       string `json:"image" xorm:"VARCHAR(255)"`        // ghcr.io/acme/backend-api
    Runtime     string `json:"runtime" xorm:"VARCHAR(16)"`       // docker-compose|kubernetes|systemd
    ComposeFile string `json:"compose_file" xorm:"VARCHAR(255)"`
    Service     string `json:"service" xorm:"VARCHAR(128)"`      // compose service / k8s workload
    HealthPath  string `json:"health_path" xorm:"VARCHAR(255)"`
    Port        int    `json:"port"`
    OwnerTeam   string `json:"owner_team" xorm:"VARCHAR(64)"`
}
```

### 3.4 `environments` — 环境（保护与审批策略）

```go
type Environment struct {
    ID                int64  `json:"id" xorm:"pk autoincr 'id'"`
    Created           int64  `json:"created" xorm:"created"`
    Updated           int64  `json:"updated" xorm:"updated"`
    OrgID             int64  `json:"org_id" xorm:"INDEX 'org_id'"`
    Name              string `json:"name" xorm:"UNIQUE 'name'"` // production|staging|development
    Title             string `json:"title" xorm:"VARCHAR(64)"`
    Protected         bool   `json:"protected"`
    ApprovalRequired  bool   `json:"approval_required"`
    MinimumApprovers  int    `json:"minimum_approvers"`
    AutoRollback      bool   `json:"auto_rollback"`
    DeployWindow      string `json:"deploy_window" xorm:"VARCHAR(128)"`
    Domain            string `json:"domain" xorm:"VARCHAR(255)"`
    Color             string `json:"color" xorm:"VARCHAR(16)"`
}
```

### 3.5 `releases` — 不可变发布产物

```go
type Release struct {
    ID            int64  `json:"id" xorm:"pk autoincr 'id'"`
    Created       int64  `json:"created" xorm:"created"`
    Updated       int64  `json:"updated" xorm:"updated"`
    OrgID         int64  `json:"org_id" xorm:"INDEX 'org_id'"`
    ApplicationID int64  `json:"application_id" xorm:"INDEX 'application_id'"`
    PipelineID    int64  `json:"pipeline_id" xorm:"INDEX 'pipeline_id'"`
    Version       string `json:"version" xorm:"VARCHAR(64)"`
    Commit        string `json:"commit" xorm:"VARCHAR(64)"`
    Digest        string `json:"digest" xorm:"VARCHAR(128)"`  // sha256:... 不可变镜像
    Image         string `json:"image" xorm:"VARCHAR(255)"`
    SizeBytes     int64  `json:"size_bytes"`
    Author        string `json:"author" xorm:"VARCHAR(64)"`
    Status        string `json:"status" xorm:"VARCHAR(16)"`   // ready|deployed|superseded|rolled_back
    Note          string `json:"note" xorm:"VARCHAR(255)"`
}
```

> **Release 生成钩子**：成功流水线发布镜像后，由 Server 侧 pipeline 完成回调自动创建 Release（原型中"成功且已生成 Release 的行显示火箭按钮"）。

### 3.6 `deployments` + 3.7 `deployment_targets` — 部署与逐节点状态

```go
type Deployment struct {
    ID                int64              `json:"id" xorm:"pk autoincr 'id'"`
    Created           int64              `json:"created" xorm:"created"`
    Updated           int64              `json:"updated" xorm:"updated"`
    OrgID             int64              `json:"org_id" xorm:"INDEX 'org_id'"`
    ApplicationID     int64              `json:"application_id" xorm:"INDEX 'application_id'"`
    EnvironmentID     int64              `json:"environment_id" xorm:"INDEX 'environment_id'"`
    ReleaseID         int64              `json:"release_id" xorm:"INDEX 'release_id'"`
    PreviousReleaseID int64              `json:"previous_release_id"`
    PipelineID        int64              `json:"pipeline_id"`
    GroupID           int64              `json:"group_id"`
    Status            string             `json:"status" xorm:"VARCHAR(24)"`
    // draft|pending_approval|rejected|approved|running|success|failed|cancelled
    Strategy          string             `json:"strategy" xorm:"VARCHAR(16)"` // single|all-at-once|rolling
    BatchSize         int                `json:"batch_size"`
    Progress          int                `json:"progress"`
    TriggeredBy       string             `json:"triggered_by" xorm:"VARCHAR(64)"`
    ApprovedBy        string             `json:"approved_by" xorm:"VARCHAR(64)"`
    ApprovedAt        int64              `json:"approved_at"`
    StartedAt         int64              `json:"started_at"`
    FinishedAt        int64              `json:"finished_at"`
    RollbackOf        int64              `json:"rollback_of"`     // 回滚部署 → 被回滚的 deployment id
    RolledBackTo      int64              `json:"rolled_back_to"`  // 本部署被哪个回滚替代
    Logs              []DeploymentLog    `json:"logs" xorm:"JSON 'logs'"`
}

type DeploymentLog struct {
    At      int64  `json:"at"`
    Level   string `json:"level"`  // info|success|warning|danger
    Message string `json:"message"`
}

type DeploymentTarget struct {
    DeploymentID int64  `json:"deployment_id" xorm:"pk 'deployment_id'"`
    ServerID     int64  `json:"server_id" xorm:"pk 'server_id'"`
    Status       string `json:"status" xorm:"VARCHAR(16)"`
    // queued|deploying|health_check|healthy|failed|skipped|rolled_back
    Phase        string `json:"phase" xorm:"VARCHAR(16)"` // waiting|pulling|starting|health_check|healthy
    Message      string `json:"message" xorm:"VARCHAR(255)"`
    Attempts     int    `json:"attempts"`
    StartedAt    int64  `json:"started_at"`
    FinishedAt   int64  `json:"finished_at"`
}
```

### 3.8 `approvals` — 审批记录

```go
type Approval struct {
    ID           int64  `json:"id" xorm:"pk autoincr 'id'"`
    Created      int64  `json:"created" xorm:"created"`
    OrgID        int64  `json:"org_id" xorm:"INDEX 'org_id'"`
    DeploymentID int64  `json:"deployment_id" xorm:"INDEX 'deployment_id'"`
    Approver     string `json:"approver" xorm:"VARCHAR(64)"`
    Approved     bool   `json:"approved"` // true=批准 false=拒绝
    Comment      string `json:"comment" xorm:"VARCHAR(255)"`
}
```

### 3.9 `alerts` — 告警

```go
type Alert struct {
    ID             int64  `json:"id" xorm:"pk autoincr 'id'"`
    Created        int64  `json:"created" xorm:"created"`
    Updated        int64  `json:"updated" xorm:"updated"`
    OrgID          int64  `json:"org_id" xorm:"INDEX 'org_id'"`
    Type           string `json:"type" xorm:"VARCHAR(32)"`  // cpu|memory|disk|container_restart|server_offline|deployment_failed
    Severity       string `json:"severity" xorm:"VARCHAR(16)"` // info|warning|critical
    Status         string `json:"status" xorm:"VARCHAR(16)"`   // active|acknowledged|resolved
    ServerID       int64  `json:"server_id" xorm:"INDEX 'server_id'"`
    DeploymentID   int64  `json:"deployment_id"`
    Message        string `json:"message" xorm:"VARCHAR(255)"`
    AcknowledgedBy string `json:"acknowledged_by" xorm:"VARCHAR(64)"`
    ResolvedBy     string `json:"resolved_by" xorm:"VARCHAR(64)"`
    ResolvedAt     int64  `json:"resolved_at"`
}
```

### 3.10 `audit_logs` — 审计日志（只追加）

```go
type AuditLog struct {
    ID           int64  `json:"id" xorm:"pk autoincr 'id'"`
    Created      int64  `json:"created" xorm:"created"`
    OrgID        int64  `json:"org_id" xorm:"INDEX 'org_id'"`
    Actor        string `json:"actor" xorm:"VARCHAR(64)"`         // 用户或 node-agent:<name>
    Action       string `json:"action" xorm:"VARCHAR(64)"`        // server.register|server.maintenance|deployment.approve|deployment.deploy|deployment.rollback|cert.revoke|...
    ResourceType string `json:"resource_type" xorm:"VARCHAR(32)"`
    ResourceID   int64  `json:"resource_id"`
    Detail       string `json:"detail" xorm:"VARCHAR(512)"`
    IP           string `json:"ip" xorm:"VARCHAR(64)"`
}
```

---

## 4. API 设计

注册位置：`server/router/api.go` 的 `apiRoutes()`，新增 `api/ops/` handler 包（遵循现有 `server/api/*.go` 单文件风格）。权限中间件沿用 `session.MustUser/MustAdmin/MustOrgMember`。

### 4.1 基础设施（`/api/infrastructure`）

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/api/infrastructure/overview` | MustUser | 聚合：服务器计数、平均指标、活动告警、最近部署、控制面状态（对齐原型概览页） |
| GET | `/api/infrastructure/servers` | MustUser | 列表 + 搜索/状态/环境/组筛选 + 分页 |
| POST | `/api/infrastructure/servers` | MustOrgMember | 注册服务器（生成 Node Agent 引导令牌） |
| GET | `/api/infrastructure/servers/:server_id` | MustUser | 详情 |
| PATCH | `/api/infrastructure/servers/:server_id` | MustOrgMember | 更新标签/组等 |
| DELETE | `/api/infrastructure/servers/:server_id` | MustAdmin | 移除（吊销证书前置确认） |
| POST | `/api/infrastructure/servers/:server_id/maintenance` | MustOrgMember | 切换维护模式（body: `{maintenance:true}`） |
| POST | `/api/infrastructure/servers/:server_id/restart` | MustOrgMember | 重启 Node Agent 或指定服务（body: `{service?}`） |
| POST | `/api/infrastructure/servers/:server_id/cert/revoke` | MustAdmin | 吊销节点证书 |
| GET | `/api/infrastructure/servers/:server_id/metrics` | MustUser | 指标时间序列（12 采样点） |
| GET | `/api/infrastructure/servers/:server_id/deployments` | MustUser | 该节点参与的部署 |
| GET/POST | `/api/infrastructure/groups` | MustUser/MustOrgMember | 服务器组列表/创建 |
| GET/PATCH/DELETE | `/api/infrastructure/groups/:group_id` | MustUser/MustOrgMember/MustAdmin | 组详情/更新/删除 |
| GET | `/api/infrastructure/services` | MustUser | 跨服务器聚合的服务/容器视图（由 servers + runtime 状态推导） |
| POST | `/api/infrastructure/services/:server_id/:service/restart` | MustOrgMember | 重启服务实例 |
| GET | `/api/infrastructure/alerts` | MustUser | 告警列表（active/acknowledged/resolved 筛选） |
| POST | `/api/infrastructure/alerts/:alert_id/acknowledge` | MustOrgMember | 确认告警 |
| POST | `/api/infrastructure/alerts/:alert_id/resolve` | MustOrgMember | 解决告警 |

### 4.2 部署控制面

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET/POST | `/api/applications` | MustUser/MustOrgMember | 应用列表/创建 |
| GET/PATCH/DELETE | `/api/applications/:app_id` | MustUser/MustOrgMember/MustAdmin | 应用详情/更新/删除 |
| GET/POST | `/api/environments` | MustUser/MustAdmin | 环境列表/创建（创建环境默认仅 Admin） |
| GET/PATCH/DELETE | `/api/environments/:env_id` | MustUser/MustAdmin/MustAdmin | 详情/更新/删除 |
| GET/POST | `/api/releases` | MustUser/MustOrgMember | Release 列表（按应用/环境筛选）/手动登记 |
| GET | `/api/releases/:release_id` | MustUser | 详情 |
| GET/POST | `/api/deployments` | MustUser/MustOrgMember | 部署列表/创建（草稿或直接 pending_approval） |
| GET | `/api/deployments/:deployment_id` | MustUser | 详情（含 targets、logs） |
| POST | `/api/deployments/:deployment_id/approve` | MustOrgMember | 审批通过（记录 approvals，达 minimumApprovers 才放行） |
| POST | `/api/deployments/:deployment_id/reject` | MustOrgMember | 拒绝 |
| POST | `/api/deployments/:deployment_id/pause` | MustOrgMember | 暂停 |
| POST | `/api/deployments/:deployment_id/resume` | MustOrgMember | 继续 |
| POST | `/api/deployments/:deployment_id/cancel` | MustOrgMember | 取消 |
| POST | `/api/deployments/:deployment_id/advance` | MustOrgMember | 手动推进下一批（滚动策略） |
| POST | `/api/deployments/:deployment_id/retry` | MustOrgMember | 重试失败节点（body: `{serverIds:[]}`） |
| POST | `/api/deployments/:deployment_id/rollback` | MustOrgMember | 创建回滚 Deployment（指向 previous release） |
| GET | `/api/deployments/:deployment_id/logs` | MustUser | 下载部署日志 |
| GET/PATCH | `/api/policies` | MustUser/MustAdmin | 部署策略（默认值：批次、健康检查、回滚开关） |
| GET | `/api/audit-logs` | MustAdmin | 审计日志查询 |

### 4.3 Node Agent 专用通道（mTLS，独立中间件 `session.MustNodeAgent`）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/node-agent/register` | 首次注册：引导令牌换长期证书（CSR 流程） |
| POST | `/api/node-agent/heartbeat` | 心跳 + 指标上报（5s 周期，Server 落库并判离线告警） |
| GET | `/api/node-agent/tasks` | 长轮询拉取待执行动作（部署/重启/维护指令，Server 私钥签名） |
| POST | `/api/node-agent/tasks/:task_id/result` | 回报执行结果（成功/失败/日志） |
| POST | `/api/node-agent/cert/rotate` | 证书轮换 |

---

## 5. 部署编排引擎（`server/ops/engine`）

新增 Go 包 `server/ops/`，内含状态机与调度器（goroutine + 定时器，类似现有 `server/scheduler` 模式）。

### 5.1 状态机

```text
Deployment:
  draft ──► pending_approval ──► approved ──► running ──► success
     │            │                 │            │  ▲
     │            ▼                 ▼            ▼  │
     └────────► rejected       (approval ok)   failed ──► cancelled(手动)
                                                  │
                                                  ▼
                                            rollback 创建新 Deployment
                                            (release ← previous_release)

Target（逐节点）:
  queued ──► deploying ──► health_check ──► healthy
     │          │              │
     │          ▼              ▼
     └────► skipped        failed ──► (retry 重试) / (整体回滚)
```

### 5.2 推进规则（对齐原型行为）

1. **策略**：`single`（逐台）、`all-at-once`（全部并行）、`rolling`（按 `batch_size` 分批）。
2. **批次推进**：本批全部 `healthy` 后自动推进下一批；`rolling` 可 `advance` 手动提前推进。
3. **预检查**（原型 step 4）：目标节点离线 → skip；磁盘 ≥85% → 标记警告，拉镜像前二次检查；同节点并发部署锁 → 排队。
4. **健康检查**：`GET :port{health_path}`，重试 N 次（默认 3 次，间隔 5s），失败则节点 `failed`。
5. **失败处理**：节点失败 → Deployment `failed`；`autoRollback=true`（环境配置）时自动创建回滚部署；否则等待人工 `retry` / `rollback` / `cancel`。
6. **审批**：`approvalRequired` 环境需 `minimumApprovers` 人批准才 `approved`；拒绝 → `rejected`。
7. **幂等**：Deployment 创建时对 `(application_id, environment_id)` 加部署锁（`server/ops/lock`，内存 + 数据库双重），防止并发双跑。
8. **审计**：每次状态迁移、审批、重试、回滚都写 `audit_logs` 并发布 pubsub 事件。

### 5.3 执行抽象（Phase 2 模拟 → Phase 3 真实）

```go
// server/ops/executor/executor.go
type Executor interface {
    Deploy(ctx context.Context, target DeploymentTarget, release Release, app Application) error
    Restart(ctx context.Context, serverID int64, service string) error
    SetMaintenance(ctx context.Context, serverID int64, on bool) error
    HealthCheck(ctx context.Context, server Server, app Application) error
}
```

- **Phase 2 实现 `MockExecutor`**：直接标记成功/按原型规则注入失败（维护/离线节点失败），打通全链路。
- **Phase 3 实现 `NodeAgentExecutor`**：把动作封装成签名任务下发给 Node Agent 执行（见 §6）。

---

## 6. Node Agent 设计（真实执行）

### 6.1 形态

- **新二进制**：`cmd/node-agent/`，Go 编写，复用 `agent/` 的配置/日志/健康上报模式。
- **注册**：管理员在 UI 注册服务器获得一次性引导令牌 → Node Agent 携带令牌 + CSR 调 `/api/node-agent/register` → Server 签发短期 mTLS 客户端证书（含 `server_id`、权限 Scope），证书序列号写入 `servers.cert_serial`。
- **轮换**：证书有效期 24h，Agent 在 70% 生命周期主动 `/cert/rotate`；吊销 = Server 端将序列号列入黑名单 + 推送 `cert.revoke` 任务。

### 6.2 心跳与指标

- 每 5s `POST /heartbeat`：CPU/内存/磁盘/负载/uptime/agentVersion/运行中容器数 + 最近指标窗口。
- Server 侧：`LastHeartbeat` 超 90s → `offline` + 触发 `server_offline` 告警；恢复后自动 `online` 并解决告警（对齐原型心跳行为）。
- 指标来源：`/proc`、`docker stats`（docker 运行时）、k8s metrics API（k8s 运行时）；容器重启次数由运行时事件流统计，超阈值触发 `container_restart` 告警。

### 6.3 动作执行与签名（安全核心）

```text
Server(ops/engine)
  │  1. 构造动作 payload: {action:"deploy", server_id, release:{digest,image}, app:{...}}
  │  2. 用 Server 私钥签名 (Ed25519, 复用 server/api/signature_public_key.go 机制)
  │  3. 写入 node_tasks 表，状态 pending
  ▼
Node Agent
  │  4. 长轮询 GET /tasks（mTLS）拉取任务
  │  5. 用内置 Server 公钥验签 + 校验白名单（动作类型/镜像 digest 前缀）
  │  6. 执行（见适配器）→ 回报 result
```

- **白名单**：Node Agent 只接受 `deploy/restart/maintenance/cert_revoke` 四类动作；`deploy` 只接受 `sha256:` digest 且镜像名匹配注册的 application 前缀；**永不执行任意命令**。
- **适配器**：`docker`（pull + compose up + 健康探针）、`kubernetes`（apply manifest + rollout status）、`systemd`（systemctl + 单元健康检查）、`ssh-proxy`（可选，供无法安装 Agent 的旧节点）。
- **审计**：Agent 执行前后各写一条 `audit_logs`（actor=`node-agent:<name>`）。

### 6.4 任务表 `node_tasks`

```go
type NodeTask struct {
    ID         int64  `json:"id" xorm:"pk autoincr 'id'"`
    Created    int64  `json:"created" xorm:"created"`
    Updated    int64  `json:"updated" xorm:"updated"`
    ServerID   int64  `json:"server_id" xorm:"INDEX 'server_id'"`
    Type       string `json:"type" xorm:"VARCHAR(16)"`  // deploy|restart|maintenance|cert_revoke
    Payload    string `json:"payload" xorm:"TEXT"`      // JSON + 签名
    Signature  string `json:"signature" xorm:"TEXT"`
    Status     string `json:"status" xorm:"VARCHAR(16)"` // pending|running|success|failed
    Result     string `json:"result" xorm:"TEXT"`
    DeploymentID int64 `json:"deployment_id"`
}
```

---

## 7. 实时推送

- **复用现有 `server/pubsub`**：新增 Topics：
  - `server.metrics.<server_id>`（指标刷新）
  - `deployment.progress.<deployment_id>`（状态/批次推进）
  - `deployment.logs.<deployment_id>`（实时日志行）
  - `alert.created` / `alert.updated`
- **前端接入**：扩展 `server/api/stream.go` 的 SSE 端点（或新增 WS），`compositions/useEvents.ts` 已封装事件订阅，直接复用；网络不可用时降级为 `useInterval` 轮询（`compositions/useInterval.ts` 已有）。
- 部署日志流：Node Agent 回报 → engine 追加 `deployment.logs` → SSE 推送到 Deployment 详情页。

---

## 8. 前端实现（Vue 3）

### 8.1 路由新增（`web/src/router.ts`）

```text
/infrastructure                    → views/infrastructure/InfrastructureOverview.vue
/infrastructure/servers            → views/infrastructure/InfrastructureServers.vue
/infrastructure/servers/:serverId  → views/infrastructure/InfrastructureServer.vue (tabs: overview/monitoring/workloads/deployments/events/settings)
/infrastructure/groups             → views/infrastructure/InfrastructureGroups.vue
/infrastructure/groups/:groupId    → views/infrastructure/InfrastructureGroup.vue
/infrastructure/services           → views/infrastructure/InfrastructureServices.vue
/infrastructure/alerts             → views/infrastructure/InfrastructureAlerts.vue

/deployments                       → views/deployments/Deployments.vue
/deployments/new                   → views/deployments/DeploymentNew.vue (5 步向导)
/deployments/:deploymentId         → views/deployments/DeploymentDetail.vue
/deployments/approvals             → views/deployments/DeploymentApprovals.vue
/deployments/apps                  → views/deployments/Applications.vue
/deployments/apps/:appId           → views/deployments/ApplicationDetail.vue
/deployments/environments          → views/deployments/Environments.vue
/deployments/environments/:envId   → views/deployments/EnvironmentDetail.vue
/deployments/releases              → views/deployments/Releases.vue
/deployments/policies              → views/deployments/DeploymentPolicies.vue
```

跨模块入口（对齐原型）：
- 成功流水线 → "部署"按钮 → `/deployments/new?pipelineId=841&releaseId=301&applicationId=1`
- 仓库流水线列表 → 有 Release 的行显示火箭按钮（复用 `data-action="new-deployment"` 逻辑）
- 应用详情 → "部署应用" → 向导；Release 列表 → 从指定 Release 发起
- 服务器详情 ↔ 告警中心 ↔ Deployment 双向跳转

### 8.2 目录与组件拆分

```text
web/src/
├── views/infrastructure/       # 7 个页面
├── views/deployments/          # 10 个页面
├── components/ops/
│   ├── ServerMetrics.vue       # 指标趋势（复用原型 sparkline 思路，改 SVG/Vue 图表）
│   ├── DeploymentWizard.vue    # 5 步向导（step 状态机组件）
│   ├── DeploymentProgress.vue  # 逐节点进度/批次可视化
│   ├── DeploymentTargetRow.vue
│   ├── DeploymentLogStream.vue # 实时日志（SSE）
│   ├── ApprovalDialog.vue
│   ├── AlertCenter.vue
│   ├── ServerTable.vue / ServerHealthBadge.vue
│   └── infrastructure-tabs.ts  # 服务器 6 标签 / 基础设施 4 标签
├── store/
│   ├── servers.ts  deployments.ts  releases.ts  alerts.ts   # Pinia
├── lib/api/
│   ├── infrastructure.ts  deployments.ts  releases.ts  alerts.ts  # 客户端模块
│   └── types/ (Server, ServerGroup, Application, Environment, Release, Deployment, Alert, AuditLog)
└── compositions/useDeployment.ts  useServerMetrics.ts  useAlerts.ts
```

### 8.3 主题与视觉统一（Phase 1 核心）

- 原型 `app.css` 的 CSS 变量（Token：`--bg`、`--surface`、`--border`、`--accent`、状态色 danger/warning/success/info）映射进 `web/src/tailwind.css` 的 `@theme`，形成 Tailwind 4 语义类（`bg-surface`、`text-accent`…）。
- 深色为主、浅色可切换：现有 `compositions/useTheme.ts` 已有主题切换，扩展为原型双主题 Token 集。
- 原子组件替换：现有 `atomic/Button.vue`、`Badge.vue`、`Icon.vue` 按原型视觉重写（保留 props/API 兼容，避免全量重构）。
- 现有 45 个 CI 页面逐页对照原型截图做视觉对齐（布局、表格密度、状态色、空态/加载态）。
- 表格宽屏滚动容器、移动端抽屉侧边栏等响应式规则直接移植自原型 `app.css`。

### 8.4 状态与数据流

- Pinia store 持有 `deployments/servers/alerts` 缓存；SSE 事件 → store action 增量更新（复用 `useEvents.ts`）。
- 部署向导为本地组件状态（draft），提交后调 `POST /api/deployments` 创建，跳转详情页订阅进度。
- 5 步向导步骤：① 选择应用与 Release → ② 目标环境（展示保护/审批/发布窗口）→ ③ 服务器组与策略（single/all-at-once/rolling + 批次）→ ④ 预检查（实时拉服务器状态）→ ⑤ 确认（审批要求提示 + 审计说明）。
- i18n：`locales/en` + `locales/zh` 全量文案（沿用现有 vue-i18n 结构，`@intlify/unplugin-vue-i18n` 已配置）。

---

## 9. 安全边界（对照原型 README 落地）

1. Build Agent / Node Agent 角色分离，Node Agent 不执行仓库任意 Shell。
2. mTLS：独立 CA、短期证书、自动轮换、序列号黑名单吊销。
3. Release 使用不可变 `sha256:` digest，拒绝 `latest` 标签部署。
4. Production 环境默认 `protected + approvalRequired`。
5. 浏览器不持有 SSH 私钥/生产 Secret（部署动作一律经 Server 签名下发）。
6. 所有部署、维护、重启、证书操作写入 `audit_logs`。
7. 告警中心支持确认/解决流转，杜绝告警沉默。

---

## 10. 分阶段实施计划

### Phase 1 — 视觉统一（纯前端，无后端依赖）

| # | 任务 | 产出 |
|---|---|---|
| 1.1 | 提取原型 Token → Tailwind `@theme` | `web/src/tailwind.css` 主题 |
| 1.2 | 重写 `atomic/` 组件视觉（Button/Badge/Icon/表格/表单） | 组件库换皮 |
| 1.3 | 布局重构（侧边栏/顶栏/移动端抽屉） | `layout/` 组件 |
| 1.4 | 逐页对齐 45 个 CI 页面 | views 视觉升级 |
| 1.5 | 响应式 + 空态/加载态/错误态统一 | 全站一致性 |

**验收**：45 个 CI 页面与原型截图像素级对齐；`pnpm typecheck`、`pnpm lint`、`pnpm test` 全绿。

### Phase 2 — 部署控制面（后端模型/API/引擎 + 前端，Mock 执行器）

| # | 任务 |
|---|---|
| 2.1 | 10 张表 model + xormigrate 迁移 |
| 2.2 | `server/api/ops/`：基础设施 + 部署控制面全部端点 |
| 2.3 | `server/ops/engine`：状态机、批次调度、审批、部署锁、审计 |
| 2.4 | `MockExecutor` 打通端到端（含原型注入失败规则） |
| 2.5 | Release 生成钩子（成功流水线 → 自动创建 Release） |
| 2.6 | pubsub Topics + SSE 扩展 |
| 2.7 | 前端 10 个部署页面 + 7 个基础设施页面 + ops 组件 + Pinia + API 客户端 |
| 2.8 | 跨模块入口（流水线→部署、服务器↔告警↔部署） |

**验收**：走通原型 README 的三条推荐流程（服务器运维、流水线部署到生产、失败回滚），全部在真实 API 上完成，无需刷新页面即可看到状态流转。

### Phase 3 — Node Agent 真实执行

| # | 任务 |
|---|---|
| 3.1 | `cmd/node-agent/` 二进制：注册/mTLS/心跳/指标采集 |
| 3.2 | 签名任务下发 + 白名单校验（复用签名公钥机制） |
| 3.3 | 适配器：docker-compose / kubernetes / systemd |
| 3.4 | 健康检查探针、容器重启告警、离线判定 |
| 3.5 | 证书轮换与吊销 |
| 3.6 | 真实节点端到端验证（staging 环境先行） |

**验收**：在真实 staging 服务器上完成滚动部署、健康检查失败自动回滚、维护模式切换、审计日志完整。

---

## 11. 风险与未决问题

| 风险 | 影响 | 缓解 |
|---|---|---|
| 与上游 woodpecker 同步冲突 | 大改动增加 merge 成本 | 新代码尽量独立于上游热路径（独立包 `ops/`、独立路由组）；Phase 1 不碰后端 |
| 部署引擎并发/幂等 | 双跑导致生产事故 | 部署锁（应用×环境）、任务去重、状态机仅允许合法迁移 |
| Node Agent 权限过大 | 安全边界被突破 | 最小权限 + 白名单 + 签名 + mTLS + 审计，先 staging 试点 |
| 指标采集开销 | 高频采样拖垮节点 | 采样 5s 窗口聚合，Server 端落库限流 |
| 数据库迁移兼容 | 升级破坏现有安装 | xormigrate 增量迁移 + 回滚测试 |
| i18n 文案量 | Phase 2 页面多 | 中文先行，英文随页面同步补 |
| 原型的"部署日志实时流" | SSE 长连接成本 | 复用现有 stream 机制 + 断线重连 + 落库兜底 |
