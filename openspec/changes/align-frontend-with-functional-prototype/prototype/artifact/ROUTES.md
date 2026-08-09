# 页面与路由

## 原有 CI/CD 页面

| # | 页面 | 路由 |
|---:|---|---|
| 1 | 登录 | `#/login` |
| 2 | Overview | `#/overview` |
| 3 | 仓库列表 | `#/repos` |
| 4 | 添加仓库 | `#/repos/add` |
| 5 | 仓库流水线列表 | `#/repos/101` |
| 6 | 分支列表 | `#/repos/101/branches` |
| 7 | 分支详情 | `#/repos/101/branches/main` |
| 8 | Pull Request 列表 | `#/repos/101/pull-requests` |
| 9 | Pull Request 详情 | `#/repos/101/pull-requests/92` |
| 10 | 手动运行流水线 | `#/repos/101/manual` |
| 11 | 流水线概览 | `#/repos/101/pipeline/842` |
| 12 | 流水线日志 | `#/repos/101/pipeline/842?tab=logs` |
| 13 | 变更文件 | `#/repos/101/pipeline/842/changed-files` |
| 14 | 流水线配置 | `#/repos/101/pipeline/842/config` |
| 15 | 错误分析 | `#/repos/101/pipeline/842/errors` |
| 16 | Debug 会话 | `#/repos/101/pipeline/842/debug` |
| 17 | 仓库基本设置 | `#/repos/101/settings` |
| 18 | Repository Secrets | `#/repos/101/settings/secrets` |
| 19 | Repository Registries | `#/repos/101/settings/registries` |
| 20 | Cron | `#/repos/101/settings/crons` |
| 21 | 状态徽章 | `#/repos/101/settings/badge` |
| 22 | 仓库操作 | `#/repos/101/settings/actions` |
| 23 | 扩展 | `#/repos/101/settings/extensions` |
| 24 | 组织仓库 | `#/orgs/1` |
| 25 | 组织 Secrets | `#/orgs/1/settings/secrets` |
| 26 | 组织 Registries | `#/orgs/1/settings/registries` |
| 27 | 组织 Agents | `#/orgs/1/settings/agents` |
| 28 | 管理员概览 | `#/admin` |
| 29 | 全局 Secrets | `#/admin/secrets` |
| 30 | 全局 Registries | `#/admin/registries` |
| 31 | 管理仓库 | `#/admin/repos` |
| 32 | 管理用户 | `#/admin/users` |
| 33 | 管理组织 | `#/admin/orgs` |
| 34 | Build Agent 集群 | `#/admin/agents` |
| 35 | 构建任务队列 | `#/admin/queue` |
| 36 | Forge 列表 | `#/admin/forges` |
| 37 | Forge 详情 | `#/admin/forges/1` |
| 38 | 新建 Forge | `#/admin/forges/create` |
| 39 | 个人资料 | `#/user` |
| 40 | 个人 Secrets | `#/user/secrets` |
| 41 | 个人 Registries | `#/user/registries` |
| 42 | CLI 与 API | `#/user/cli-and-api` |
| 43 | 个人 Agents | `#/user/agents` |
| 44 | CLI 授权 | `#/cli/auth` |
| 45 | 404 | 任意不存在的路径 |

## 新增：基础设施与服务器运维

| # | 页面 | 路由 |
|---:|---|---|
| 46 | 基础设施概览 | `#/infrastructure` |
| 47 | 服务器列表 | `#/infrastructure/servers` |
| 48 | 服务器详情：概览 | `#/infrastructure/servers/201` |
| 49 | 服务器详情：监控 | `#/infrastructure/servers/201?tab=monitoring` |
| 50 | 服务器详情：工作负载 | `#/infrastructure/servers/201?tab=workloads` |
| 51 | 服务器详情：部署 | `#/infrastructure/servers/201?tab=deployments` |
| 52 | 服务器详情：事件 | `#/infrastructure/servers/201?tab=events` |
| 53 | 服务器详情：设置 | `#/infrastructure/servers/201?tab=settings` |
| 54 | 服务器组 | `#/infrastructure/groups` |
| 55 | 服务器组详情 | `#/infrastructure/groups/1` |
| 56 | 服务与容器 | `#/infrastructure/services` |
| 57 | 告警中心 | `#/infrastructure/alerts` |

## 新增：应用与部署控制面

| # | 页面 | 路由 |
|---:|---|---|
| 58 | 部署中心 | `#/deployments` |
| 59 | 新建部署向导 | `#/deployments/new` |
| 60 | Deployment 详情 | `#/deployments/142` |
| 61 | 生产审批 | `#/deployments/approvals` |
| 62 | 应用列表 | `#/deployments/apps` |
| 63 | 应用详情 | `#/deployments/apps/1` |
| 64 | 环境列表 | `#/deployments/environments` |
| 65 | 环境详情 | `#/deployments/environments/1` |
| 66 | Release 列表 | `#/deployments/releases` |
| 67 | 部署策略 | `#/deployments/policies` |

## 跨模块入口

| 来源 | 行为 |
|---|---|
| 成功流水线 `#/repos/101/pipeline/841` | 点击“部署”进入带 Release 的部署向导 |
| 仓库流水线列表 `#/repos/101` | 成功且已生成 Release 的行显示火箭按钮 |
| 应用详情 `#/deployments/apps/1` | 点击“部署应用”进入部署向导 |
| Release 列表 `#/deployments/releases` | 从指定 Release 发起部署 |
| 服务器详情 | 查看该节点参与的 Deployment，并切换维护模式 |
| 告警中心 | 跳转关联服务器或 Deployment，执行确认与解决 |
