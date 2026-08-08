# Woodpecker CI + 服务器运维与部署控制面原型

这是一套由真实 HTML、CSS 和 JavaScript 实现的高保真功能原型。它不是截图播放器，也没有使用透明热区模拟交互。

本版本在原有 Woodpecker CI 原型上增加了完整的 **Infrastructure & Deployment Control Plane**：既保留代码仓库、流水线、日志、Secret、Agent 和管理后台，也加入服务器状态监控、应用与环境、Release、生产审批、逐节点滚动部署、失败重试和回滚。

## 运行方式

### 直接打开

双击 `index.html`。项目使用经典脚本与 Hash Router，不需要 Node.js、构建工具或联网。

### 启动本地 HTTP 服务

```bash
python3 serve.py
```

然后访问：

```text
http://127.0.0.1:4173/#/overview
```

Windows 可直接运行：

```text
start.bat
```

运维模块入口：

```text
#/infrastructure
```

部署模块入口：

```text
#/deployments
```

## 页面规模

- 60 条实际路由匹配规则
- 67 个已验证的页面与标签状态
- 17 条新增运维/部署路由
- 5 个服务器详情附加标签状态
- 5 步真实部署向导
- 桌面、平板和手机响应式布局

完整清单见 [`ROUTES.md`](ROUTES.md)。

## 新增：服务器运维

### 基础设施概览

统一展示：

- 服务器在线、维护和异常数量
- 平均 CPU、内存、磁盘与网络状态
- 服务器健康列表
- 活动告警
- 最近部署
- 部署控制面状态

### 服务器管理

已实现：

- 服务器搜索与状态、环境、服务器组筛选
- 注册服务器表单
- 服务器组与标签
- Node Agent 在线状态和心跳
- CPU、内存、磁盘、网络指标
- Docker、Kubernetes、systemd 工作负载
- 容器和服务重启
- 维护模式切换
- 服务器诊断信息复制
- Node Agent 重启
- 节点证书吊销与服务器移除确认

服务器详情包含：

```text
概览 / 监控 / 工作负载 / 部署 / 事件 / 设置
```

### 告警

支持：

- 活动、已确认和已解决筛选
- CPU、磁盘、容器重启、服务器离线等告警
- 确认告警
- 解决告警
- 关联服务器、服务与最近部署

## 新增：应用交付与部署

### 产品模型

```text
Repository / Pipeline
        ↓
      Release
        ↓
    Application
        ↓
    Environment
        ↓
   Server Group
        ↓
      Servers
```

### 应用、环境和 Release

已实现：

- 应用列表与应用详情
- 仓库、镜像、运行时和健康检查配置
- Development、Staging、Production 环境
- 受保护环境与审批要求
- Server Group 绑定
- Release 列表与流水线来源
- 当前生产、预发布版本展示
- 从成功流水线或 Release 直接发起部署

### 5 步部署向导

```text
1. 选择应用与 Release
2. 选择目标环境
3. 选择服务器组与部署策略
4. 部署前检查
5. 确认并提交/开始部署
```

支持：

- 单节点、全部同时和滚动部署策略
- 批次大小
- 自动回滚开关
- 生产审批
- 服务器在线、维护、磁盘和并发部署预检查

### 部署详情

已实现：

- Deployment 状态与发布进度
- 逐服务器目标状态
- 实时部署日志
- 批准、拒绝、暂停、继续和取消
- 手动推进下一批
- 失败节点重试
- 创建回滚 Deployment
- 下载部署日志
- Release 与流水线双向入口

部署状态会在浏览器内存中真实变化，而不是静态占位：审批后会按目标节点推进；维护或异常节点会触发失败；失败部署可进入回滚流程。

## 原有 CI/CD 功能

- 仓库列表、搜索和筛选
- 四步添加仓库向导
- 分支与 Pull Request 页面
- 手动运行流水线
- 流水线步骤、图形视图、重试和取消
- 日志搜索、仅错误、自动换行和下载
- Changed Files 与 Diff
- YAML 配置编辑和格式化
- 错误分析和 Debug 会话
- Repository、Organization、Global、User Secret
- Registry、Cron、状态徽章和扩展
- Build Agent、任务队列与 Forge 管理
- 用户、组织和系统管理
- CLI 与 API Token、设备授权
- 深色/浅色主题和本地偏好
- `Ctrl/Cmd + K` 命令面板

## 推荐体验流程

### 从服务器进入运维

```text
基础设施
→ 服务器
→ prod-api-01
→ 监控 / 工作负载
→ 进入维护
```

### 从流水线部署到生产

```text
backend-api 成功流水线
→ 部署
→ Production
→ prod-api 服务器组
→ Rolling / 每批 1 台
→ 提交审批
→ 批准并部署
→ 查看逐节点进度与日志
```

可直接从：

```text
#/repos/101/pipeline/841
```

开始此流程。

### 失败与回滚

```text
Deployment 详情
→ 某个节点健康检查失败
→ 重试失败节点 / 停止部署
→ 创建回滚
→ 发布上一稳定 Release
```

## 工程结构

```text
woodpecker-functional-prototype-with-ops/
├── index.html
├── serve.py
├── start.bat
├── README.md
├── ROUTES.md
├── TEST_REPORT.md
└── assets/
    ├── app.css       # Token、组件、运维与部署页面、响应式样式
    ├── data.js       # CI、服务器、应用、环境、Release、Deployment 模拟数据
    ├── ui.js         # SVG 图标、状态、按钮、Badge 与通用 UI
    ├── views.js      # 所有实际页面渲染函数
    └── app.js        # Router、状态、表单、调度模拟和业务交互
```

## 实际产品化时的安全边界

本原型将 Build Agent 与未来的 Node Agent 视为不同角色：

- Build Agent 负责测试、构建和生成 Release，不持有生产服务器权限。
- Node Agent 负责上报服务器状态，只执行结构化、签名且在白名单中的部署动作。
- Production 环境默认受保护，并通过审批后才能部署。
- Release 应使用不可变镜像 Digest，而不是只依赖 `latest`。
- Controller 与 Node Agent 应采用 mTLS、独立证书、证书轮换和吊销机制。
- 浏览器不应获得 SSH 私钥或生产 Secret。
- 所有部署、维护、重启和证书操作必须进入审计日志。

## 原型边界

当前版本是可交互的前端功能原型：

- 不连接真实 Woodpecker API
- 不采集真实服务器指标
- 不建立 SSH 或 Node Agent 连接
- 不执行真实 Docker、Kubernetes 或 systemd 操作
- 不推送真实镜像，也不修改生产服务器
- 业务数据位于浏览器内存，刷新后恢复初始值
- 主题偏好使用 `localStorage` 保存

这套代码可以直接作为后续 Vue 3 组件化、OpenAPI 客户端、WebSocket 实时层和真实 Ops Controller 对接的产品基线。
