## 1. Lifecycle Baseline And Route Inventory

用户结果：用户可以确认全部 67 个原型路由均有可追溯的需求、审批、设计与开发基线。

- [x] 1.1 Validate the four foundation specs and change-level requirements artifacts with current SpecNav contracts.
- [x] 1.2 Verify and explicitly approve the user-designed functional prototype as the production alignment source.
- [x] 1.3 Record all 67 prototype routes and tab states in `route-parity.md` without merging or dropping entries.
- [x] 1.4 Commit the approved proposal, requirements, prototype handoff, design, parity matrix, and this unchanged task list as the standard-lane development baseline.
- [x] 1.5 Pass SpecNav Development Entry and write the required before-development, basis, promotion, complexity, task graph, context, owner, and extraction artifacts.

## 2. Data Integrity And Shared Shell Baseline

用户结果：用户可以在桌面端和移动端看到可信的日期、时长、导航与通用状态反馈。

- [x] 2.1 Reproduce and fix invalid or extreme user-visible dates and durations through the shared formatting boundary, with focused regression tests.
- [x] 2.2 Verify the 248px sidebar, 64px topbar, drawer behavior, theme toggle, locale behavior, global search placeholder, and permission-aware navigation against the prototype.
- [x] 2.3 Add or repair shared loading, empty, error, disabled, permission, and stale-state primitives required by at least two route families.
- [x] 2.4 Capture equivalent dark/light desktop and 390px shell evidence before route-family implementation.

## 3. Pipeline Detail Vertical Slice

用户结果：用户可以查看并操作与批准原型一致的流水线详情、步骤、日志和诊断标签页。

- [x] 3.1 Rebuild the pipeline detail header, status metadata, primary actions, and prototype-aligned tab navigation using real pipeline and repository permissions.
- [x] 3.2 Rebuild the pipeline overview to show step status, duration, environment/image context, execution summary, and log entry without losing current approval, decline, restart, cancel, and deploy behavior.
- [x] 3.3 Align pipeline log, changed-files, configuration, error analysis, and debug tabs with shared cards, tables, controls, and responsive behavior.
- [x] 3.4 Add focused component/router tests for pipeline status variants, permissions, actions, tabs, empty/error states, and mobile behavior.
- [x] 3.5 Run focused and full frontend validation, then record desktop/mobile dark-mode and representative light-mode pipeline evidence.

## 4. Repository Route Family

用户结果：用户可以浏览、筛选和管理与批准原型一致的仓库流水线、分支、拉取请求及设置。

- [x] 4.1 Align repository pipeline-list metrics, filters, table/list density, status actions, pagination, empty state, and deploy entry.
- [x] 4.2 Align branch list/detail and pull-request list/detail routes with real Forge and pipeline data.
- [x] 4.3 Align manual-run, general settings, secrets, registries, crons, badge, actions, and extensions routes without changing existing contracts.
- [x] 4.4 Add repository route/component tests for filters, permissions, actions, pagination, empty/error states, theme, and 390px behavior.
- [x] 4.5 Verify every repository parity-matrix row and record same-state screenshot evidence.

## 5. Organization, Administration, And User Routes

用户结果：用户、组织管理员和系统管理员可以按各自权限查看并管理对应的设置与资源。

- [x] 5.1 Align organization repository, secret, registry, and agent routes with the prototype settings/navigation structure.
- [x] 5.2 Align administrator overview, secrets, registries, repositories, users, organizations, agents, queue, forge list/detail/create routes.
- [x] 5.3 Align personal profile, secrets, registries, CLI/API, agents, CLI authorization, login, and not-found routes.
- [x] 5.4 Preserve administrator, repository, organization, guest, and authenticated-user permission boundaries in UI visibility and direct-route behavior.
- [x] 5.5 Add focused route/component tests and verify all organization, administration, user, authentication, and error-state parity rows.

## 6. Operations Route Reconciliation

用户结果：操作员可以在等价数据与权限状态下使用与批准原型一致的基础设施和部署页面。

- [x] 6.1 Re-verify Overview and Repositories in equivalent dark/light, Simplified Chinese/English, desktop/mobile, permission, and data states.
- [x] 6.2 Re-verify Infrastructure overview, servers, server tabs, groups, services, and alerts against all prototype route states.
- [x] 6.3 Re-verify Deployments, wizard steps, detail states, approvals, applications, environments, releases, and policies against all prototype route states.
- [x] 6.4 Repair remaining structural, content, status, action, data-integrity, or responsive deltas without importing prototype fixtures.
- [x] 6.5 Add regression tests for every repaired operations behavior and update matrix evidence.

## 7. Accessibility, Internationalization, And Responsive Closure

用户结果：用户可以通过键盘、辅助技术、不同语言和 390px 移动端稳定访问已完成的页面。

- [x] 7.1 Remove untranslated visible strings from completed slices and verify Simplified Chinese plus English fallback.
- [x] 7.2 Verify keyboard navigation, visible focus, semantic controls, accessible labels, status text/icon pairing, and reduced-motion behavior.
- [x] 7.3 Verify desktop, tablet, and 390px layouts with no page-level horizontal overflow and contained scrolling for dense tables and logs.
- [x] 7.4 Verify light and dark semantic token parity without page-local color systems.

## 8. Full Verification And Completion

用户结果：用户可以依据完整验证报告判断每个路由是否达到原型对齐标准及仍有哪些未完成项。

- [x] 8.1 Run Prettier check, ESLint, TypeScript, all Vitest tests, Vite build, and `git diff --check`.
- [x] 8.2 Run facticity, static, unit, redteam, E2E, and sensory verification against requirements and the full parity matrix.
- [x] 8.3 Produce the SpecNav HTML verification report with evidence for every completed assertion and route row.
- [ ] 8.4 Leave incomplete or blocked route rows and tasks explicit; do not claim global prototype parity until all 67 rows are verified.
