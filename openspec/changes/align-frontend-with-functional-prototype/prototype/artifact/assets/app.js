(function () {
  'use strict';

  const data = window.WP_DATA;
  const ui = window.WP_UI;
  const views = window.WP_VIEWS;
  const app = document.getElementById('app');

  const persistedTheme = (() => {
    try { return localStorage.getItem('wp-prototype-theme'); } catch (_) { return null; }
  })();

  const state = {
    theme: persistedTheme || 'dark',
    sidebarOpen: false,
    commandOpen: false,
    commandQuery: '',
    modal: null,
    drawer: null,
    dropdown: null,
    filters: {
      repoSearch: '', repoStatus: 'all', repoForge: 'all',
      pipelineSearch: '', pipelineStatus: 'all', pipelineBranch: 'all', pipelineEvent: 'all',
      branchSearch: '', prStatus: 'all', secretSearch: '', userSearch: '',
      agentSearch: '', agentStatus: 'all', agentBackend: 'all',
      serverSearch: '', serverStatus: 'all', serverGroup: 'all', serverRegion: 'all',
      serviceSearch: '', serviceStatus: 'all', serviceApplication: 'all',
      alertSeverity: 'all', alertStatus: 'all',
      deploymentSearch: '', deploymentStatus: 'all', deploymentEnvironment: 'all', deploymentApplication: 'all',
      applicationSearch: '', releaseApplication: 'all', releaseStatus: 'all',
    },
    wizardStep: 1,
    selectedRepoIds: [105],
    selectedStep: 4,
    pipelineDetailTab: 'details',
    pipelineGraph: false,
    logSearch: '',
    logErrorsOnly: false,
    logWrap: true,
    activeDiffFile: data.changedFiles[0].path,
    pipelineConfig: '',
    debugSessionActive: false,
    manualVars: [{ key: 'NODE_ENV', value: 'production' }, { key: 'DEPLOY_ENV', value: 'staging' }],
    badgeStyle: 'flat',
    selectedSecretId: null,
    revealedSecrets: [],
    apiToken: '',
    cliApproved: false,
    queuePaused: false,
    deployWizardStep: 1,
    deploymentDraft: { applicationId: 1, releaseId: 301, environmentId: 1, groupId: 1, strategy: 'rolling', batchSize: 1 },
    deploymentLogWrap: true,
    deploymentTimers: {},
    extensions: [
      { id: 'vault', name: 'HashiCorp Vault', description: '在运行时从 Vault 注入 Secret。', enabled: true, icon: 'key' },
      { id: 'policy', name: 'Open Policy Agent', description: '在执行前验证流水线安全策略。', enabled: false, icon: 'shield' },
      { id: 'cache', name: 'Remote Cache', description: '在 Agent 间共享依赖缓存。', enabled: true, icon: 'archive' },
      { id: 'notify', name: 'Chat Notifications', description: '把流水线状态发送到 Slack 或 Teams。', enabled: false, icon: 'bell' },
    ],
  };

  document.documentElement.dataset.theme = state.theme;

  const routes = [
    ['login', /^\/login$/],
    ['overview', /^\/overview$/],
    ['repoAdd', /^\/repos\/add$/],
    ['pipelineChangedFiles', /^\/repos\/(\d+)\/pipeline\/(\d+)\/changed-files$/, ['repoId','pipelineId']],
    ['pipelineConfig', /^\/repos\/(\d+)\/pipeline\/(\d+)\/config$/, ['repoId','pipelineId']],
    ['pipelineErrors', /^\/repos\/(\d+)\/pipeline\/(\d+)\/errors$/, ['repoId','pipelineId']],
    ['pipelineDebug', /^\/repos\/(\d+)\/pipeline\/(\d+)\/debug$/, ['repoId','pipelineId']],
    ['pipeline', /^\/repos\/(\d+)\/pipeline\/(\d+)$/, ['repoId','pipelineId']],
    ['repoSettingsSecrets', /^\/repos\/(\d+)\/settings\/secrets$/, ['repoId']],
    ['repoSettingsRegistries', /^\/repos\/(\d+)\/settings\/registries$/, ['repoId']],
    ['repoSettingsCrons', /^\/repos\/(\d+)\/settings\/crons$/, ['repoId']],
    ['repoSettingsBadge', /^\/repos\/(\d+)\/settings\/badge$/, ['repoId']],
    ['repoSettingsActions', /^\/repos\/(\d+)\/settings\/actions$/, ['repoId']],
    ['repoSettingsExtensions', /^\/repos\/(\d+)\/settings\/extensions$/, ['repoId']],
    ['repoSettingsGeneral', /^\/repos\/(\d+)\/settings$/, ['repoId']],
    ['repoManual', /^\/repos\/(\d+)\/manual$/, ['repoId']],
    ['repoPullRequest', /^\/repos\/(\d+)\/pull-requests\/(\d+)$/, ['repoId','pullRequest']],
    ['repoPullRequests', /^\/repos\/(\d+)\/pull-requests$/, ['repoId']],
    ['repoBranch', /^\/repos\/(\d+)\/branches\/(.+)$/, ['repoId','branch']],
    ['repoBranches', /^\/repos\/(\d+)\/branches$/, ['repoId']],
    ['repoPipelines', /^\/repos\/(\d+)$/, ['repoId']],
    ['repos', /^\/repos$/],
    ['infrastructureServer', /^\/infrastructure\/servers\/(\d+)$/, ['serverId']],
    ['infrastructureServers', /^\/infrastructure\/servers$/],
    ['infrastructureGroup', /^\/infrastructure\/groups\/(\d+)$/, ['groupId']],
    ['infrastructureGroups', /^\/infrastructure\/groups$/],
    ['infrastructureServices', /^\/infrastructure\/services$/],
    ['infrastructureAlerts', /^\/infrastructure\/alerts$/],
    ['infrastructureOverview', /^\/infrastructure$/],
    ['deploymentNew', /^\/deployments\/new$/],
    ['deploymentApprovals', /^\/deployments\/approvals$/],
    ['application', /^\/deployments\/apps\/(\d+)$/, ['applicationId']],
    ['applications', /^\/deployments\/apps$/],
    ['environment', /^\/deployments\/environments\/(\d+)$/, ['environmentId']],
    ['environments', /^\/deployments\/environments$/],
    ['releases', /^\/deployments\/releases$/],
    ['deploymentPolicies', /^\/deployments\/policies$/],
    ['deployment', /^\/deployments\/(\d+)$/, ['deploymentId']],
    ['deployments', /^\/deployments$/],
    ['orgSecrets', /^\/orgs\/(\d+)\/settings\/secrets$/, ['orgId']],
    ['orgRegistries', /^\/orgs\/(\d+)\/settings\/registries$/, ['orgId']],
    ['orgAgents', /^\/orgs\/(\d+)\/settings\/agents$/, ['orgId']],
    ['orgRepos', /^\/orgs\/(\d+)$/, ['orgId']],
    ['adminForgeCreate', /^\/admin\/forges\/create$/],
    ['adminForge', /^\/admin\/forges\/(\d+)$/, ['forgeId']],
    ['adminForges', /^\/admin\/forges$/],
    ['adminSecrets', /^\/admin\/secrets$/],
    ['adminRegistries', /^\/admin\/registries$/],
    ['adminRepos', /^\/admin\/repos$/],
    ['adminUsers', /^\/admin\/users$/],
    ['adminOrgs', /^\/admin\/orgs$/],
    ['adminAgents', /^\/admin\/agents$/],
    ['adminQueue', /^\/admin\/queue$/],
    ['adminInfo', /^\/admin$/],
    ['userSecrets', /^\/user\/secrets$/],
    ['userRegistries', /^\/user\/registries$/],
    ['userCLI', /^\/user\/cli-and-api$/],
    ['userAgents', /^\/user\/agents$/],
    ['userGeneral', /^\/user$/],
    ['cliAuth', /^\/cli\/auth$/],
  ];

  function parseRoute() {
    const raw = location.hash.replace(/^#/, '') || '/overview';
    const [pathRaw, queryString = ''] = raw.split('?');
    const path = pathRaw.startsWith('/') ? pathRaw : `/${pathRaw}`;
    const query = Object.fromEntries(new URLSearchParams(queryString).entries());
    for (const [name, pattern, keys = []] of routes) {
      const match = path.match(pattern);
      if (match) {
        const params = {};
        keys.forEach((key, index) => { params[key] = decodeURIComponent(match[index + 1]); });
        return { name, path, query, params };
      }
    }
    return { name: 'notFound', path, query, params: {} };
  }

  function navigate(path) {
    state.modal = null;
    state.drawer = null;
    state.dropdown = null;
    state.commandOpen = false;
    state.sidebarOpen = false;
    location.hash = path.startsWith('#') ? path.slice(1) : path;
  }

  function activeNav(path, target) {
    if (target === '/overview') return path === '/overview';
    if (target === '/repos') return path.startsWith('/repos');
    if (target === '/orgs/1') return path.startsWith('/orgs');
    if (target === '/deployments') return path.startsWith('/deployments');
    if (target === '/infrastructure') return path.startsWith('/infrastructure');
    if (target === '/admin/agents') return path.startsWith('/admin/agents');
    if (target === '/admin/queue') return path.startsWith('/admin/queue');
    if (target === '/admin') return path.startsWith('/admin') && !path.startsWith('/admin/agents') && !path.startsWith('/admin/queue');
    if (target === '/user/secrets') return path === '/user/secrets';
    return path === target;
  }

  function navLink(route, label, iconName, currentPath, count) {
    return `<a class="nav-link ${activeNav(currentPath, route) ? 'active' : ''}" href="#${route}">${ui.icon(iconName, 17)}<span>${ui.esc(label)}</span>${count != null ? `<span class="nav-count">${ui.esc(count)}</span>` : ''}</a>`;
  }

  function renderSidebar(route) {
    return `<aside class="sidebar" aria-label="主导航">
      <div class="sidebar-brand">${ui.logo(34)}<div class="brand-copy"><strong>Woodpecker</strong><small>CI/CD Platform</small></div><button class="icon-btn sidebar-collapse" data-action="close-sidebar" aria-label="收起导航">${ui.icon('chevronLeft',17)}</button></div>
      <button class="workspace-switch" data-action="toast" data-payload='{"message":"工作区切换器已打开"}'><span class="workspace-logo">AC</span><span><strong>Acme Corp</strong></span>${ui.icon('chevronDown',15)}</button>
      <div class="sidebar-scroll">
        <div class="nav-section"><div class="nav-label">工作区</div>${navLink('/overview','概览','home',route.path)}${navLink('/repos','仓库','repo',route.path,data.repositories.length)}${navLink('/repos/101','流水线','pipeline',route.path)}${navLink('/orgs/1','组织','organization',route.path,data.organizations.length)}</div>
        <div class="nav-section"><div class="nav-label">交付</div>${navLink('/deployments','部署中心','rocket',route.path,data.deployments.filter(item=>['running','waiting_approval'].includes(item.status)).length)}${navLink('/deployments/apps','应用','app',route.path,data.applications.length)}${navLink('/deployments/environments','环境','environment',route.path,data.environments.length)}</div>
        <div class="nav-section"><div class="nav-label">服务器运维</div>${navLink('/infrastructure','基础设施','activity',route.path)}${navLink('/infrastructure/servers','服务器','server',route.path,data.servers.length)}${navLink('/infrastructure/alerts','告警','alert',route.path,data.alerts.filter(item=>item.status==='active').length)}</div>
        <div class="nav-section"><div class="nav-label">构建基础设施</div>${navLink('/admin/agents','Build Agents','agent',route.path,data.agents.length)}${navLink('/admin/queue','任务队列','queue',route.path,data.queue.length)}${navLink('/user/secrets','Secrets','lock',route.path,data.secrets.length)}</div>
        <div class="nav-section"><div class="nav-label">管理</div>${navLink('/admin','系统管理','settings',route.path)}${navLink('/admin/users','用户','users',route.path)}${navLink('/admin/forges','Forge','forge',route.path)}</div>
        <div class="nav-section"><div class="nav-label">帮助</div><a class="nav-link" href="https://woodpecker-ci.org/docs/" target="_blank" rel="noreferrer">${ui.icon('file',17)}<span>文档</span>${ui.icon('external',13,'nav-count')}</a><button class="nav-link" style="width:100%;border:0;background:transparent;text-align:left;cursor:pointer" data-action="toast" data-payload='{"message":"支持入口已打开"}'>${ui.icon('help',17)}<span>支持</span></button></div>
      </div>
      <div class="sidebar-footer"><a class="nav-link ${route.path.startsWith('/user') ? 'active' : ''}" href="#/user">${ui.avatar('Alice','sm')}<span>个人设置</span>${ui.icon('chevronRight',14,'nav-count')}</a></div>
    </aside>`;
  }

  function renderTopbar() {
    return `<header class="topbar" data-specnav-component="global-topbar"><button class="icon-btn mobile-menu" data-action="toggle-sidebar" aria-label="打开导航">${ui.icon('menu',18)}</button><button class="global-search" data-action="open-command">${ui.icon('search',17)}<span>搜索流水线、仓库、用户和设置…</span><kbd>⌘ K</kbd></button><div class="topbar-spacer"></div><button class="icon-btn" data-action="toggle-theme" data-specnav-theme-control="light-dark" aria-label="切换主题">${ui.icon(state.theme === 'dark' ? 'sun' : 'moon',17)}</button><button class="icon-btn" data-action="open-notifications" aria-label="通知">${ui.icon('bell',17)}<span class="status-dot success" style="position:absolute;width:6px;height:6px;margin:-18px 0 0 16px"></span></button><button class="user-menu" data-action="open-user-menu">${ui.avatar('Alice','md')}<span class="user-meta"><strong>Alice</strong><small>Administrator</small></span>${ui.icon('chevronDown',14)}</button></header>`;
  }

  const commandItems = [
    { group: '导航', label: '打开概览', path: '/overview', icon: 'home', hint: 'G O' },
    { group: '导航', label: '查看仓库', path: '/repos', icon: 'repo', hint: 'G R' },
    { group: '导航', label: '打开部署中心', path: '/deployments', icon: 'rocket', hint: 'G D' },
    { group: '导航', label: '打开基础设施', path: '/infrastructure', icon: 'activity', hint: 'G I' },
    { group: '导航', label: '查看服务器', path: '/infrastructure/servers', icon: 'server', hint: 'G V' },
    { group: '导航', label: '查看 Agent', path: '/admin/agents', icon: 'agent', hint: 'G A' },
    { group: '导航', label: '系统管理', path: '/admin', icon: 'settings', hint: 'G S' },
    { group: '仓库', label: 'acme/backend-api', path: '/repos/101', icon: 'repo', hint: 'main' },
    { group: '仓库', label: 'acme/web-frontend', path: '/repos/102', icon: 'repo', hint: 'main' },
    { group: '流水线', label: '#842 · fix null check', path: '/repos/101/pipeline/842', icon: 'pipeline', hint: 'failed' },
    { group: '流水线', label: '#841 · add pagination', path: '/repos/101/pipeline/841', icon: 'pipeline', hint: 'success' },
    { group: '操作', label: '运行 backend-api 流水线', action: 'open-run-modal', icon: 'play', hint: '⌘ ↵' },
    { group: '操作', label: '新建部署', action: 'new-deployment', icon: 'rocket', hint: '⌘ D' },
    { group: '操作', label: '注册服务器', action: 'open-server-register', icon: 'server', hint: '' },
    { group: '操作', label: '新建 Secret', action: 'open-secret-modal', icon: 'key', hint: '' },
    { group: '设置', label: '个人设置', path: '/user', icon: 'user', hint: '' },
    { group: '设置', label: 'CLI 与 API', path: '/user/cli-and-api', icon: 'terminal', hint: '' },
  ];

  function renderCommandPalette() {
    if (!state.commandOpen) return '';
    const q = state.commandQuery.trim().toLowerCase();
    const items = commandItems.filter((item) => !q || `${item.group} ${item.label} ${item.hint}`.toLowerCase().includes(q));
    let lastGroup = '';
    return `<div class="command-backdrop" data-action="close-command"><div class="command-palette" data-stop-propagation><div class="command-input">${ui.icon('search',20)}<input id="command-query" autocomplete="off" value="${ui.esc(state.commandQuery)}" placeholder="输入命令或搜索…" data-command-query/><kbd class="muted">ESC</kbd></div><div class="command-results">${items.length ? items.map((item,index)=>{const group=item.group!==lastGroup?`<div class="command-group">${ui.esc(item.group)}</div>`:'';lastGroup=item.group;return `${group}<div class="command-item ${index===0?'active':''}" data-action="command-item" data-payload='${ui.esc(JSON.stringify(item))}'>${ui.icon(item.icon,17)}<span>${ui.esc(item.label)}</span><small>${ui.esc(item.hint)}</small></div>`}).join('') : `<div class="empty-state" style="min-height:170px"><h3>没有匹配命令</h3><p>尝试搜索仓库名称、流水线编号或设置。</p></div>`}</div></div></div>`;
  }

  function renderModal() {
    const modal = state.modal;
    if (!modal) return '';
    const payload = modal.payload || {};
    const close = `<button class="icon-btn" data-action="close-modal">${ui.icon('x',17)}</button>`;
    if (modal.type === 'run') {
      const repo = data.repositories.find((r)=>r.id===Number(payload.repoId)) || data.repositories[0];
      return `<div class="modal-backdrop" data-action="close-modal"><form class="modal" data-form="run-pipeline" data-stop-propagation><div class="modal-header"><div><h2>运行流水线</h2><p>${ui.esc(repo.owner)}/${ui.esc(repo.name)}</p></div>${close}</div><div class="modal-body stack">${ui.field('分支',ui.select('branch',data.branches.map(b=>b.name),payload.branch||repo.branch))}${ui.field('事件',ui.select('event',[{value:'manual',label:'手动运行'},{value:'deployment',label:'部署'},{value:'push',label:'Push'}],'manual'))}${ui.field('说明',ui.input('message','Manual pipeline run',{placeholder:'本次运行说明'}))}<label class="checkbox"><input type="checkbox" name="deploy"/>标记为部署事件</label><div class="alert">${ui.icon('info',18)}<div><strong>将执行 5 个步骤</strong><p>预计占用 linux/x64 Agent 约 8 分钟。</p></div></div><input type="hidden" name="repoId" value="${repo.id}"/></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button('开始运行',{variant:'primary',icon:'play',type:'submit'})}</div></form></div>`;
    }
    if (modal.type === 'secret') {
      const existing = payload.secretId ? data.secrets.find((s)=>s.id===Number(payload.secretId)) : null;
      return `<div class="modal-backdrop" data-action="close-modal"><form class="modal" data-form="secret" data-stop-propagation><div class="modal-header"><div><h2>${existing?'编辑':'新建'} Secret</h2><p>值会在保存后加密并隐藏。</p></div>${close}</div><div class="modal-body stack">${ui.field('名称',ui.input('name',existing?.name||'',{required:true,placeholder:'例如 DOCKER_PASSWORD'}))}${ui.field('值',`<textarea class="textarea mono" name="value" required placeholder="输入 Secret 值">${ui.esc(existing?.value||'')}</textarea>`)}<div class="form-grid">${ui.field('类型',ui.select('type',[{value:'secret',label:'Secret'},{value:'variable',label:'Variable'}],existing?.type||'secret'))}${ui.field('作用域',ui.select('scope',['Repository','Organization','Global','User','Production','Staging'],payload.scope||existing?.scope||'Repository'))}</div><label class="checkbox"><input type="checkbox" checked/>允许在 Pull Request 流水线中使用</label><input type="hidden" name="secretId" value="${existing?.id||''}"/></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button(existing?'保存':'创建 Secret',{variant:'primary',icon:'check',type:'submit'})}</div></form></div>`;
    }
    if (modal.type === 'registry') {
      const existing = payload.registryId ? data.registries.find((r)=>r.id===Number(payload.registryId)) : null;
      return `<div class="modal-backdrop" data-action="close-modal"><form class="modal" data-form="registry" data-stop-propagation><div class="modal-header"><div><h2>${existing?'编辑':'添加'}镜像仓库</h2><p>配置容器镜像认证。</p></div>${close}</div><div class="modal-body stack">${ui.field('Registry 地址',ui.input('address',existing?.address||'',{required:true,placeholder:'registry.example.com'}))}${ui.field('用户名',ui.input('username',existing?.username||'',{required:true}))}${ui.field('密码或 Token',ui.input('password','',{type:'password',required:!existing,placeholder:existing?'留空则不修改':'输入凭据'}))}${ui.field('作用域',ui.select('scope',['Repository','Organization','Global','User','Production'],payload.scope||existing?.scope||'Repository'))}<label class="checkbox"><input type="checkbox" checked/>保存前测试连接</label><input type="hidden" name="registryId" value="${existing?.id||''}"/></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button('保存镜像仓库',{variant:'primary',icon:'check',type:'submit'})}</div></form></div>`;
    }
    if (modal.type === 'cron') {
      const existing = payload.cronId ? data.crons.find((c)=>c.id===Number(payload.cronId)) : null;
      return `<div class="modal-backdrop" data-action="close-modal"><form class="modal" data-form="cron" data-stop-propagation><div class="modal-header"><div><h2>${existing?'编辑':'新建'}定时任务</h2><p>使用标准五段 Cron 表达式。</p></div>${close}</div><div class="modal-body stack">${ui.field('名称',ui.input('name',existing?.name||'',{required:true,placeholder:'nightly-tests'}))}${ui.field('Cron 表达式',ui.input('schedule',existing?.schedule||'0 2 * * *',{required:true}))}${ui.field('分支',ui.select('branch',data.branches.map(b=>b.name),existing?.branch||'main'))}<div class="alert">${ui.icon('clock',18)}<div><strong>下次运行预览</strong><p>今天 02:00 · Asia/Manila</p></div></div><input type="hidden" name="cronId" value="${existing?.id||''}"/></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button('保存定时任务',{variant:'primary',icon:'check',type:'submit'})}</div></form></div>`;
    }
    if (modal.type === 'user') {
      const existing = payload.userId ? data.users.find((u)=>u.id===Number(payload.userId)) : null;
      return `<div class="modal-backdrop" data-action="close-modal"><form class="modal" data-form="user" data-stop-propagation><div class="modal-header"><div><h2>${existing?'编辑用户':'邀请用户'}</h2><p>设置实例访问权限。</p></div>${close}</div><div class="modal-body stack">${ui.field('姓名',ui.input('name',existing?.name||'',{required:true}))}${ui.field('邮箱',ui.input('email',existing?.email||'',{type:'email',required:true}))}${ui.field('登录名',ui.input('login',existing?.login||'',{required:true}))}<label class="checkbox"><input type="checkbox" name="admin" ${existing?.admin?'checked':''}/>授予管理员权限</label><label class="checkbox"><input type="checkbox" name="active" ${existing?.active!==false?'checked':''}/>允许登录</label><input type="hidden" name="userId" value="${existing?.id||''}"/></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button(existing?'保存用户':'发送邀请',{variant:'primary',icon:'check',type:'submit'})}</div></form></div>`;
    }
    if (modal.type === 'org') {
      const existing = payload.orgId ? data.organizations.find((o)=>o.id===Number(payload.orgId)) : null;
      return `<div class="modal-backdrop" data-action="close-modal"><form class="modal" data-form="org" data-stop-propagation><div class="modal-header"><div><h2>${existing?'编辑组织':'新建组织'}</h2><p>配置名称和资源配额。</p></div>${close}</div><div class="modal-body stack">${ui.field('组织名称',ui.input('name',existing?.name||'',{required:true}))}${ui.field('Slug',ui.input('slug',existing?.slug||'',{required:true}))}<div class="form-grid">${ui.field('仓库配额',ui.input('repoQuota',existing?.repos||50,{type:'number'}))}${ui.field('并发任务',ui.input('concurrency',20,{type:'number'}))}</div><input type="hidden" name="orgId" value="${existing?.id||''}"/></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button(existing?'保存组织':'创建组织',{variant:'primary',icon:'check',type:'submit'})}</div></form></div>`;
    }
    if (modal.type === 'serverRegister') {
      const defaultGroup = Number(payload.groupId) || data.serverGroups[0].id;
      return `<div class="modal-backdrop" data-action="close-modal"><form class="modal modal-wide" data-form="server-register" data-stop-propagation><div class="modal-header"><div><h2>注册服务器</h2><p>创建一次性注册令牌并安装受控 Node Agent。</p></div>${close}</div><div class="modal-body stack"><div class="form-grid">${ui.field('服务器名称',ui.input('name','prod-api-04',{required:true,placeholder:'prod-api-04'}))}${ui.field('服务器组',ui.select('groupId',data.serverGroups.map(group=>({value:group.id,label:group.name})),defaultGroup))}${ui.field('区域',ui.input('region','asia-southeast-1',{required:true}))}${ui.field('可用区',ui.input('zone','sgp-1d',{required:true}))}${ui.field('私网 IP',ui.input('ip','10.20.1.14',{required:true}))}${ui.field('操作系统',ui.select('os',['Ubuntu 24.04','Debian 13','Alpine 3.22'],'Ubuntu 24.04'))}</div>${ui.field('标签',ui.input('labels','production, api, singapore'),'使用逗号分隔；用于选择部署目标。')}<div class="alert alert-success">${ui.icon('shield',18)}<div><strong>最小权限 Node Agent</strong><p>该 Agent 只接受签名的部署、健康检查、容器和 systemd 白名单动作，不执行任意 Shell。</p></div></div><div class="secret-value"><code>curl -fsSL https://ci.acme.example/node-agent/install | sudo sh -s -- --token wp_node_once_84k2</code><button class="icon-btn" type="button" data-action="copy-text" data-payload='{"text":"curl -fsSL https://ci.acme.example/node-agent/install | sudo sh -s -- --token wp_node_once_84k2"}'>${ui.icon('copy',15)}</button></div></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button('创建并等待连接',{variant:'primary',icon:'server',type:'submit'})}</div></form></div>`;
    }
    if (modal.type === 'serverGroup') {
      const existing = payload.groupId ? data.serverGroups.find(group=>group.id===Number(payload.groupId)) : null;
      return `<div class="modal-backdrop" data-action="close-modal"><form class="modal" data-form="server-group" data-stop-propagation><div class="modal-header"><div><h2>${existing?'编辑':'新建'}服务器组</h2><p>把节点按环境、角色和部署策略组织起来。</p></div>${close}</div><div class="modal-body stack">${ui.field('名称',ui.input('name',existing?.name||'',{required:true,placeholder:'prod-api'}))}${ui.field('说明',`<textarea class="textarea" name="description" required>${ui.esc(existing?.description||'Production application nodes')}</textarea>`)}<div class="form-grid">${ui.field('环境',ui.select('environmentId',data.environments.map(env=>({value:env.id,label:env.title})),existing?.environmentId||1))}${ui.field('部署策略',ui.select('strategy',[{value:'rolling',label:'滚动部署'},{value:'all-at-once',label:'全部同时部署'},{value:'manual-batches',label:'手动分批'}],existing?.strategy||'rolling'))}${ui.field('批次大小',ui.input('batchSize',existing?.batchSize||1,{type:'number',required:true}))}${ui.field('服务端口',ui.input('port',existing?.port||8080,{type:'number',required:true}))}</div>${ui.field('健康检查路径',ui.input('healthPath',existing?.healthPath||'/health',{required:true}))}${ui.field('标签',ui.input('labels',(existing?.labels||['production']).join(', ')))}<input type="hidden" name="groupId" value="${existing?.id||''}"/></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button('保存服务器组',{variant:'primary',icon:'check',type:'submit'})}</div></form></div>`;
    }
    if (modal.type === 'application') {
      const existing = payload.applicationId ? data.applications.find(app=>app.id===Number(payload.applicationId)) : null;
      return `<div class="modal-backdrop" data-action="close-modal"><form class="modal modal-wide" data-form="application" data-stop-propagation><div class="modal-header"><div><h2>${existing?'编辑':'新建'}应用</h2><p>关联代码仓库、镜像产物和运行方式。</p></div>${close}</div><div class="modal-body stack"><div class="form-grid">${ui.field('应用名称',ui.input('name',existing?.name||'',{required:true,placeholder:'backend-api'}))}${ui.field('代码仓库',ui.select('repoId',data.repositories.map(repo=>({value:repo.id,label:`${repo.owner}/${repo.name}`})),existing?.repoId||101))}${ui.field('镜像地址',ui.input('image',existing?.image||'ghcr.io/acme/application',{required:true}))}${ui.field('运行方式',ui.select('runtime',['docker-compose','systemd','kubernetes'],existing?.runtime||'docker-compose'))}${ui.field('Compose 文件',ui.input('composeFile',existing?.composeFile||'deploy/docker-compose.yml'))}${ui.field('服务名',ui.input('service',existing?.service||'app',{required:true}))}${ui.field('负责人',ui.input('owner',existing?.owner||'Platform'))}${ui.field('健康检查',ui.input('healthPath',existing?.healthPath||'/health',{required:true}))}</div>${ui.field('说明',`<textarea class="textarea" name="description">${ui.esc(existing?.description||'')}</textarea>`)}<input type="hidden" name="applicationId" value="${existing?.id||''}"/></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button('保存应用',{variant:'primary',icon:'check',type:'submit'})}</div></form></div>`;
    }
    if (modal.type === 'environment') {
      const existing = payload.environmentId ? data.environments.find(env=>env.id===Number(payload.environmentId)) : null;
      return `<div class="modal-backdrop" data-action="close-modal"><form class="modal modal-wide" data-form="environment" data-stop-propagation><div class="modal-header"><div><h2>${existing?'编辑':'新建'}环境</h2><p>配置目标、保护规则和部署行为。</p></div>${close}</div><div class="modal-body stack"><div class="form-grid">${ui.field('显示名称',ui.input('title',existing?.title||'',{required:true,placeholder:'Production'}))}${ui.field('标识',ui.input('name',existing?.name||'',{required:true,placeholder:'production'}))}${ui.field('域名模式',ui.input('domain',existing?.domain||'*.example.com'))}${ui.field('发布窗口',ui.input('deployWindow',existing?.deployWindow||'Any time'))}${ui.field('最少审批人',ui.input('minimumApprovers',existing?.minimumApprovers||0,{type:'number'}))}${ui.field('策略',ui.select('policyId',data.deploymentPolicies.map(policy=>({value:policy.id,label:policy.name})),existing?.policyId||1))}</div><label class="checkbox"><input type="checkbox" name="protected" ${existing?.protected?'checked':''}/>受保护环境</label><label class="checkbox"><input type="checkbox" name="approvalRequired" ${existing?.approvalRequired?'checked':''}/>部署前需要审批</label><label class="checkbox"><input type="checkbox" name="autoRollback" ${existing?.autoRollback!==false?'checked':''}/>健康检查失败时自动回滚</label><input type="hidden" name="environmentId" value="${existing?.id||''}"/></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button('保存环境',{variant:'primary',icon:'check',type:'submit'})}</div></form></div>`;
    }
    if (modal.type === 'agentInstall') {
      return `<div class="modal-backdrop" data-action="close-modal"><div class="modal modal-wide" data-stop-propagation><div class="modal-header"><div><h2>注册新 Agent</h2><p>选择运行方式并复制安装命令。</p></div>${close}</div><div class="modal-body stack"><div class="segmented"><button class="active">Docker</button><button>Kubernetes</button><button>Binary</button></div>${ui.field('Agent Token',`<div class="secret-value"><code>wp_agent_84k2_demo_token</code><button class="icon-btn" data-action="copy-text" data-payload='{"text":"wp_agent_84k2_demo_token"}'>${ui.icon('copy',15)}</button></div>`)}${ui.field('Docker 命令',`<div class="secret-value"><code>docker run -d --name woodpecker-agent -e WOODPECKER_SERVER=ci.acme.example:9000 -e WOODPECKER_AGENT_SECRET=wp_agent_84k2_demo_token woodpeckerci/woodpecker-agent:latest</code><button class="icon-btn" data-action="copy-text" data-payload='{"text":"docker run -d --name woodpecker-agent -e WOODPECKER_SERVER=ci.acme.example:9000 -e WOODPECKER_AGENT_SECRET=wp_agent_84k2_demo_token woodpeckerci/woodpecker-agent:latest"}'>${ui.icon('copy',15)}</button></div>`)}<div class="alert alert-warning">${ui.icon('warning',18)}<div><strong>Token 只显示一次</strong><p>关闭此窗口前请保存到安全位置。</p></div></div></div><div class="modal-footer">${ui.button('完成',{variant:'primary',action:'close-modal'})}</div></div></div>`;
    }
    if (modal.type === 'systemSettings') {
      return `<div class="modal-backdrop" data-action="close-modal"><form class="modal modal-wide" data-form="system-settings" data-stop-propagation><div class="modal-header"><div><h2>系统设置</h2><p>修改实例级默认值。</p></div>${close}</div><div class="modal-body stack"><div class="form-grid">${ui.field('实例名称',ui.input('name','Woodpecker CI'))}${ui.field('服务器 URL',ui.input('url','https://ci.acme.example',{type:'url'}))}${ui.field('默认时区',ui.select('timezone',['Asia/Manila','UTC','Asia/Shanghai'],'Asia/Manila'))}${ui.field('日志保留天数',ui.input('retention',30,{type:'number'}))}${ui.field('最大并发流水线',ui.input('concurrency',100,{type:'number'}))}${ui.field('默认超时',ui.select('timeout',['30 分钟','60 分钟','120 分钟'],'60 分钟'))}</div><div class="setting-row"><div><h3>允许注册新用户</h3><p>来自已配置 Forge 的用户可以首次登录。</p></div><label class="switch"><input type="checkbox" checked/><span></span></label></div></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button('保存系统设置',{variant:'primary',icon:'check',type:'submit'})}</div></form></div>`;
    }
    if (modal.type === 'confirm') {
      return `<div class="modal-backdrop" data-action="close-modal"><div class="modal" data-stop-propagation><div class="modal-header"><div><h2>${ui.esc(payload.title||'确认操作')}</h2><p>${ui.esc(payload.subtitle||'此操作需要确认。')}</p></div>${close}</div><div class="modal-body"><div class="alert alert-danger">${ui.icon('warning',18)}<div><strong>${ui.esc(payload.message||'操作可能无法撤销。')}</strong><p>${ui.esc(payload.detail||'请确认你了解此操作的影响。')}</p></div></div></div><div class="modal-footer">${ui.button('取消',{variant:'ghost',action:'close-modal'})}${ui.button(payload.confirmLabel||'确认',{variant:'danger',icon:'trash',action:'confirm-action',payload:payload.actionPayload||{}})}</div></div></div>`;
    }
    return '';
  }

  function renderDrawer() {
    const drawer = state.drawer;
    if (!drawer) return '';
    const payload = drawer.payload || {};
    const close = `<button class="icon-btn" data-action="close-drawer">${ui.icon('x',17)}</button>`;
    if (drawer.type === 'secret') {
      const secret = data.secrets.find((s)=>s.id===Number(payload.secretId)) || data.secrets[0];
      const revealed = state.revealedSecrets.includes(secret.id);
      return `<div class="drawer-backdrop" data-action="close-drawer"></div><aside class="drawer"><div class="drawer-header"><div class="cluster"><h2>${ui.esc(secret.name)}</h2>${ui.badge(secret.type==='secret'?'success':'info',{label:secret.type==='secret'?'Secret':'Variable',icon:false})}</div>${close}</div><div class="drawer-body stack"><div class="secret-value"><code>${revealed?ui.esc(secret.value):'••••••••••••••••••••'}</code><button class="icon-btn" data-action="toggle-secret-reveal" data-payload='${JSON.stringify({secretId:secret.id})}'>${ui.icon(revealed?'eyeOff':'eye',15)}</button><button class="icon-btn" data-action="copy-text" data-payload='${JSON.stringify({text:secret.value})}'>${ui.icon('copy',15)}</button></div><section class="settings-section"><div class="settings-section-header"><h2>元数据</h2></div><div class="settings-section-body">${ui.statLine('名称',secret.name)}${ui.statLine('类型',secret.type)}${ui.statLine('创建者',secret.user)}${ui.statLine('最后更新',secret.updated)}${ui.statLine('权限',secret.permission)}${ui.statLine('使用次数',String(secret.used))}</div></section><section class="settings-section"><div class="settings-section-header"><h2>作用域</h2></div><div class="settings-section-body">${ui.statLine('环境',secret.scope)}${ui.statLine('可用分支','所有分支')}${ui.statLine('Pull Request','允许')}</div></section><section class="settings-section"><div class="settings-section-header"><h2>绑定仓库</h2></div><div class="settings-section-body">${secret.repositories.map((repo)=>`<div class="setting-row"><div class="cluster">${ui.icon('repo',15)}<span>${ui.esc(repo)}</span></div><span class="badge badge-neutral">默认</span></div>`).join('')}</div></section><section class="settings-section"><div class="settings-section-header"><h2>审计记录</h2></div><div class="settings-section-body"><div class="timeline"><div class="timeline-item"><strong>Secret 被流水线 #842 读取</strong><p>alice · agent-us-east-1a-01 · 2 分钟前</p></div><div class="timeline-item"><strong>Secret 已更新</strong><p>${ui.esc(secret.user)} · ${ui.esc(secret.updated)}</p></div><div class="timeline-item"><strong>Secret 已创建</strong><p>alice · 2026-07-15</p></div></div></div></section><div class="cluster">${ui.button('编辑',{icon:'edit',action:'open-secret-modal',payload:{secretId:secret.id}})}${ui.button('删除',{variant:'danger',icon:'trash',action:'delete-secret',payload:{secretId:secret.id}})}</div></div></aside>`;
    }
    if (drawer.type === 'agent') {
      const agent = data.agents.find((a)=>a.id===Number(payload.agentId)) || data.agents[0];
      return `<div class="drawer-backdrop" data-action="close-drawer"></div><aside class="drawer"><div class="drawer-header"><div><div class="cluster"><span class="status-dot ${agent.status}"></span><h2>${ui.esc(agent.name)}</h2></div><div class="table-secondary">${ui.esc(agent.ip)} · ${ui.esc(agent.region)}</div></div>${close}</div><div class="drawer-body stack"><div class="grid grid-2">${ui.metricCard({label:'CPU',value:`${agent.cpu}%`,iconName:'agent',chart:[12,18,25,30,agent.cpu]})}${ui.metricCard({label:'内存',value:`${agent.memory}%`,iconName:'archive',chart:[25,31,36,44,agent.memory]})}</div><section class="settings-section"><div class="settings-section-header"><h2>Agent 信息</h2></div><div class="settings-section-body">${ui.statLine('状态',ui.status[agent.status].label)}${ui.statLine('Backend',agent.backend)}${ui.statLine('系统',agent.os)}${ui.statLine('版本',agent.version)}${ui.statLine('运行任务',String(agent.jobs))}${ui.statLine('容量',String(agent.capacity))}${ui.statLine('最后心跳',agent.heartbeat)}</div></section><section class="settings-section"><div class="settings-section-header"><h2>标签</h2></div><div class="settings-section-body cluster">${agent.labels.map(l=>`<span class="badge badge-neutral">${ui.esc(l)}</span>`).join('')}</div></section><section class="settings-section"><div class="settings-section-header"><h2>最近任务</h2></div><div class="settings-section-body"><div class="activity-list">${data.pipelines.slice(0,4).map(p=>`<a class="activity-item" href="#/repos/${p.repoId}/pipeline/${p.id}"><span class="status-dot ${p.status}"></span><div class="activity-copy"><strong>#${p.id} ${ui.esc(p.message)}</strong><p>${ui.esc(p.duration)}</p></div>${ui.icon('chevronRight',14)}</a>`).join('')}</div></div></section><div class="cluster">${ui.button('设为维护',{icon:'settings',action:'toast',payload:{message:'Agent 已进入维护模式'}})}${ui.button('注销 Agent',{variant:'danger',icon:'trash',action:'toast',payload:{message:'Agent 已注销（原型）'}})}</div></div></aside>`;
    }
    if (drawer.type === 'audit') {
      return `<div class="drawer-backdrop" data-action="close-drawer"></div><aside class="drawer"><div class="drawer-header"><h2>审计日志</h2>${close}</div><div class="drawer-body"><div class="timeline">${['alice 查看了 DOCKER_PASSWORD','pipeline #842 读取了 AWS_ACCESS_KEY_ID','alice 更新了 SENTRY_DSN','bob 创建了 NPM_TOKEN','system 轮换了部署凭据','alice 导出了仓库配置'].map((text,index)=>`<div class="timeline-item"><strong>${ui.esc(text)}</strong><p>${index*17+2} 分钟前 · 192.168.1.${12+index}</p></div>`).join('')}</div></div></aside>`;
    }
    if (drawer.type === 'notifications') {
      return `<div class="drawer-backdrop" data-action="close-drawer"></div><aside class="drawer"><div class="drawer-header"><h2>通知</h2>${close}</div><div class="drawer-body"><div class="activity-list">${[['failure','流水线 #842 构建失败','2 分钟前'],['warning','Agent asia-southeast-1a-02 已离线','3 分钟前'],['success','流水线 #841 执行成功','18 分钟前'],['info','Pull Request #92 请求审查','1 小时前']].map(([status,title,time])=>`<div class="activity-item"><span class="status-dot ${status}"></span><div class="activity-copy"><strong>${ui.esc(title)}</strong><p>${ui.esc(time)}</p></div>${ui.icon('chevronRight',14)}</div>`).join('')}</div><div class="form-actions">${ui.button('全部标为已读',{variant:'primary',action:'toast',payload:{message:'所有通知已标记为已读'}})}</div></div></aside>`;
    }
    return '';
  }

  function renderDropdown() {
    const d = state.dropdown;
    if (!d) return '';
    const style = `left:${Math.min(d.x, window.innerWidth - 235)}px;top:${Math.min(d.y, window.innerHeight - 260)}px`;
    let items = '';
    if (d.type === 'user') {
      items = `<a class="dropdown-item" href="#/user">${ui.icon('user',16)}个人设置</a><a class="dropdown-item" href="#/user/cli-and-api">${ui.icon('terminal',16)}CLI 与 API</a><div class="dropdown-divider"></div><div class="dropdown-item" data-action="toggle-theme">${ui.icon(state.theme==='dark'?'sun':'moon',16)}切换主题</div><div class="dropdown-item danger" data-action="logout">${ui.icon('logout',16)}退出登录</div>`;
    } else if (d.type === 'repo') {
      const repoId = d.payload.repoId;
      items = `<a class="dropdown-item" href="#/repos/${repoId}">${ui.icon('repo',16)}打开仓库</a><div class="dropdown-item" data-action="open-run-modal" data-payload='${JSON.stringify({repoId})}'>${ui.icon('play',16)}运行流水线</div><a class="dropdown-item" href="#/repos/${repoId}/settings">${ui.icon('settings',16)}仓库设置</a><div class="dropdown-divider"></div><div class="dropdown-item danger" data-action="confirm-repo-action" data-payload='${JSON.stringify({type:'archive',repoId})}'>${ui.icon('archive',16)}归档仓库</div>`;
    } else if (d.type === 'pipeline') {
      const pipelineId = d.payload.pipelineId;
      items = `<div class="dropdown-item" data-action="retry-pipeline" data-payload='${JSON.stringify({pipelineId})}'>${ui.icon('retry',16)}重试流水线</div><div class="dropdown-item" data-action="copy-text" data-payload='${JSON.stringify({text:`https://ci.acme.example/repos/101/pipeline/${pipelineId}`})}'>${ui.icon('link',16)}复制链接</div><div class="dropdown-item" data-action="download-logs">${ui.icon('download',16)}下载日志</div><div class="dropdown-divider"></div><div class="dropdown-item danger" data-action="cancel-pipeline" data-payload='${JSON.stringify({pipelineId})}'>${ui.icon('stop',16)}取消流水线</div>`;
    }
    return `<div class="dropdown" style="${style}" data-stop-propagation>${items}</div>`;
  }

  function render(preserveKey) {
    const route = parseRoute();
    const view = views[route.name] || views.notFound;
    const context = { ui, data, state, route };
    const focus = preserveKey ? captureFocus(preserveKey) : null;
    if (route.name === 'login' || route.name === 'cliAuth') {
      app.innerHTML = view(context) + renderModal() + renderDrawer() + renderCommandPalette() + renderDropdown();
    } else {
      app.innerHTML = `<div class="app-shell ${state.sidebarOpen ? 'sidebar-open' : ''}">${renderSidebar(route)}${renderTopbar()}<main class="main"><div class="content">${view(context)}</div></main></div>${state.sidebarOpen ? '<div class="drawer-backdrop" style="z-index:25" data-action="close-sidebar"></div>' : ''}${renderModal()}${renderDrawer()}${renderCommandPalette()}${renderDropdown()}`;
    }
    restoreFocus(focus);
    if (state.commandOpen) setTimeout(() => document.getElementById('command-query')?.focus(), 0);
  }

  function captureFocus(key) {
    const active = document.activeElement;
    if (!active || active.dataset.preserve !== key) return { key, start: null, end: null };
    return { key, start: active.selectionStart, end: active.selectionEnd };
  }

  function restoreFocus(focus) {
    if (!focus) return;
    const target = document.querySelector(`[data-preserve="${CSS.escape(focus.key)}"]`);
    if (!target) return;
    target.focus();
    if (typeof target.setSelectionRange === 'function' && focus.start != null) target.setSelectionRange(focus.start, focus.end);
  }

  function openDropdown(type, payload, trigger) {
    const rect = trigger.getBoundingClientRect();
    state.dropdown = { type, payload: payload || {}, x: Math.max(8, rect.right - 220), y: rect.bottom + 6 };
    render();
  }

  function parsePayload(el) {
    if (!el?.dataset?.payload) return {};
    try { return JSON.parse(el.dataset.payload); } catch (_) { return {}; }
  }

  function copyText(text) {
    const value = String(text || '');
    if (navigator.clipboard && location.protocol !== 'file:') {
      navigator.clipboard.writeText(value).then(() => ui.toast('已复制到剪贴板')).catch(() => fallbackCopy(value));
    } else fallbackCopy(value);
  }

  function fallbackCopy(value) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); ui.toast('已复制到剪贴板'); } catch (_) { ui.toast('复制失败，请手动复制', 'warning'); }
    textarea.remove();
  }

  function downloadFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function toggleTheme(theme) {
    state.theme = theme || (state.theme === 'dark' ? 'light' : 'dark');
    document.documentElement.dataset.theme = state.theme;
    try { localStorage.setItem('wp-prototype-theme', state.theme); } catch (_) {}
    state.dropdown = null;
    render();
  }


  function clockTime() {
    return new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function getServer(id) {
    return data.servers.find((item) => item.id === Number(id));
  }

  function getApplication(id) {
    return data.applications.find((item) => item.id === Number(id));
  }

  function getEnvironment(id) {
    return data.environments.find((item) => item.id === Number(id));
  }

  function getRelease(id) {
    return data.releases.find((item) => item.id === Number(id));
  }

  function getDeployment(id) {
    return data.deployments.find((item) => item.id === Number(id));
  }

  function groupForApplication(application, environment, preferredGroupId) {
    if (preferredGroupId) {
      const preferred = data.serverGroups.find((item) => item.id === Number(preferredGroupId));
      if (preferred) return preferred;
    }
    const candidates = data.serverGroups.filter((group) => group.environmentId === environment.id);
    if (!candidates.length) return data.serverGroups[0];
    if (environment.name !== 'production') return candidates[0];
    const tokens = `${application.name} ${application.service}`.toLowerCase().split(/[-_\s]+/).filter(Boolean);
    return candidates.find((group) => group.labels.some((label) => tokens.includes(String(label).toLowerCase()))) || candidates[0];
  }

  function prepareDeploymentDraft(payload = {}) {
    let release = payload.releaseId ? getRelease(payload.releaseId) : null;
    if (!release && payload.pipelineId) release = data.releases.find((item) => item.pipelineId === Number(payload.pipelineId));

    let server = payload.serverId ? getServer(payload.serverId) : null;
    let application = payload.applicationId ? getApplication(payload.applicationId) : null;
    if (!application && release) application = getApplication(release.applicationId);
    if (!application && server) {
      const currentRelease = getRelease(server.currentReleaseId);
      application = currentRelease ? getApplication(currentRelease.applicationId) : null;
    }
    application ||= data.applications[0];

    if (!release || release.applicationId !== application.id) {
      release = data.releases.find((item) => item.applicationId === application.id && item.status === 'ready')
        || data.releases.find((item) => item.applicationId === application.id)
        || data.releases[0];
    }

    let environment = payload.environmentId ? getEnvironment(payload.environmentId) : null;
    if (!environment && server) environment = getEnvironment(server.environmentId);
    if (!environment && release?.environments?.length) {
      environment = data.environments.find((item) => release.environments.includes(item.name));
    }
    environment ||= getEnvironment(application.environmentIds?.[0]) || data.environments[0];

    const serverGroup = server ? data.serverGroups.find((item) => item.id === server.groupId) : null;
    const group = groupForApplication(application, environment, payload.groupId || serverGroup?.id);
    const policy = data.deploymentPolicies.find((item) => item.id === environment.policyId);

    state.deploymentDraft = {
      applicationId: application.id,
      releaseId: release.id,
      environmentId: environment.id,
      groupId: group.id,
      strategy: payload.strategy || group.strategy || policy?.strategy || 'rolling',
      batchSize: Number(payload.batchSize || group.batchSize || policy?.batchSize || 1),
      serverId: server?.id || null,
      pipelineId: Number(payload.pipelineId || release.pipelineId || 0) || null,
    };
    state.deployWizardStep = 1;
  }

  function addDeploymentLog(deployment, tone, message) {
    deployment.logs ||= [];
    deployment.logs.push([clockTime(), tone, message]);
  }

  function renderIfDeploymentVisible(deploymentId) {
    const route = parseRoute();
    if (route.name === 'deployment' && Number(route.params.deploymentId) === Number(deploymentId)) render();
    else if (['deployments', 'infrastructureOverview', 'infrastructureServers', 'application', 'environment'].includes(route.name)) render();
  }

  function scheduleDeployment(deploymentId, delay = 1500) {
    clearTimeout(state.deploymentTimers[deploymentId]);
    state.deploymentTimers[deploymentId] = setTimeout(() => {
      delete state.deploymentTimers[deploymentId];
      advanceDeployment(deploymentId, true);
    }, delay);
  }

  function markDeploymentRelease(deployment) {
    const application = getApplication(deployment.applicationId);
    const environment = getEnvironment(deployment.environmentId);
    const release = getRelease(deployment.releaseId);
    if (!application || !environment || !release) return;
    release.status = 'deployed';
    if (!release.environments.includes(environment.name)) release.environments.push(environment.name);
    if (environment.name === 'production') application.currentProductionReleaseId = release.id;
    if (environment.name === 'staging') application.currentStagingReleaseId = release.id;
    deployment.targets.forEach((target) => {
      if (target.status !== 'success') return;
      const server = getServer(target.serverId);
      if (server) server.currentReleaseId = release.id;
      data.services.filter((service) => service.serverId === target.serverId && service.applicationId === application.id).forEach((service) => {
        service.status = 'healthy';
        service.version = release.version;
        service.image = `${application.image}@${release.digest}`;
        service.uptime = '刚刚';
      });
    });
  }

  function advanceDeployment(deploymentId, automatic = false) {
    const deployment = getDeployment(deploymentId);
    if (!deployment || deployment.status !== 'running') return;

    const current = deployment.targets.find((target) => target.status === 'running' || target.status === 'deploying');
    if (current) {
      current.status = 'success';
      current.phase = 'healthy';
      current.duration = current.duration === '—' ? '1m 18s' : current.duration;
      current.message = 'Health check passed';
      const currentServer = getServer(current.serverId);
      addDeploymentLog(deployment, 'success', `${currentServer?.name || current.serverId}: health check passed`);
    }

    const next = deployment.targets.find((target) => target.status === 'queued');
    const completed = deployment.targets.filter((target) => target.status === 'success').length;
    deployment.progress = Math.round(completed / Math.max(deployment.targets.length, 1) * 100);

    if (next) {
      const server = getServer(next.serverId);
      if (!server || server.status === 'offline') {
        next.status = 'failure';
        next.phase = 'preflight';
        next.duration = '4s';
        next.message = 'Node Agent unavailable';
        deployment.status = 'failure';
        deployment.finished = '刚刚';
        deployment.progress = Math.round((completed + 1) / deployment.targets.length * 100);
        addDeploymentLog(deployment, 'danger', `${server?.name || next.serverId}: Node Agent unavailable; deployment stopped`);
        renderIfDeploymentVisible(deployment.id);
        ui.toast(`部署 DEP-${deployment.id} 在 ${server?.name || '目标节点'} 失败`, 'danger');
        return;
      }
      if (server.maintenance) {
        next.status = 'failure';
        next.phase = 'preflight';
        next.duration = '3s';
        next.message = 'Server is in maintenance mode';
        deployment.status = 'failure';
        deployment.finished = '刚刚';
        deployment.progress = Math.round((completed + 1) / deployment.targets.length * 100);
        addDeploymentLog(deployment, 'danger', `${server.name}: server is in maintenance mode`);
        renderIfDeploymentVisible(deployment.id);
        ui.toast(`部署 DEP-${deployment.id} 被维护模式阻止`, 'warning');
        return;
      }
      next.status = 'running';
      next.phase = 'deploying';
      next.duration = '0m 08s';
      next.message = 'Pulling immutable image digest';
      deployment.currentTarget = next.serverId;
      addDeploymentLog(deployment, 'command', `${server.name}: deploy ${getRelease(deployment.releaseId)?.digest || 'release digest'}`);
      deployment.progress = Math.max(deployment.progress, Math.round((completed + 0.35) / deployment.targets.length * 100));
      renderIfDeploymentVisible(deployment.id);
      if (automatic) scheduleDeployment(deployment.id, 1700);
      return;
    }

    if (deployment.targets.every((target) => target.status === 'success')) {
      deployment.status = 'success';
      deployment.progress = 100;
      deployment.finished = '刚刚';
      deployment.duration = deployment.duration === '—' ? `${Math.max(2, deployment.targets.length * 2)}m 12s` : deployment.duration;
      deployment.currentTarget = null;
      addDeploymentLog(deployment, 'success', 'Deployment completed successfully; all targets are healthy');
      markDeploymentRelease(deployment);
      renderIfDeploymentVisible(deployment.id);
      ui.toast(`部署 DEP-${deployment.id} 已成功`);
    }
  }

  function createDeploymentFromDraft() {
    const draft = state.deploymentDraft;
    const application = getApplication(draft.applicationId);
    const release = getRelease(draft.releaseId);
    const environment = getEnvironment(draft.environmentId);
    const group = data.serverGroups.find((item) => item.id === Number(draft.groupId));
    if (!application || !release || !environment || !group) {
      ui.toast('部署参数不完整，请重新选择', 'warning');
      return null;
    }
    let targetServers = group.serverIds.map(getServer).filter(Boolean);
    if (draft.serverId) targetServers = targetServers.filter((server) => server.id === Number(draft.serverId));
    if (!targetServers.length) {
      ui.toast('目标服务器组没有可用节点', 'warning');
      return null;
    }
    const previousReleaseId = environment.name === 'production' ? application.currentProductionReleaseId : application.currentStagingReleaseId;
    const deployment = {
      id: Math.max(...data.deployments.map((item) => item.id)) + 1,
      applicationId: application.id,
      environmentId: environment.id,
      releaseId: release.id,
      previousReleaseId,
      pipelineId: draft.pipelineId || release.pipelineId,
      status: environment.approvalRequired ? 'waiting_approval' : 'running',
      strategy: draft.strategy,
      batchSize: Number(draft.batchSize || 1),
      progress: 0,
      triggeredBy: 'alice',
      approvedBy: null,
      created: '刚刚',
      started: environment.approvalRequired ? '—' : '刚刚',
      finished: '—',
      duration: '—',
      groupIds: [group.id],
      currentTarget: null,
      targets: targetServers.map((server) => ({
        serverId: server.id,
        status: 'queued',
        phase: environment.approvalRequired ? 'approval' : 'waiting',
        duration: '—',
        message: environment.approvalRequired ? 'Waiting for production approval' : 'Waiting to deploy',
      })),
      logs: [
        [clockTime(), 'info', `Deployment DEP created from pipeline #${release.pipelineId}`],
        [clockTime(), 'info', `Resolved ${application.image} to ${release.digest}`],
        [clockTime(), environment.approvalRequired ? 'warning' : 'info', environment.approvalRequired ? `${environment.title} approval required` : `Starting ${draft.strategy} deployment`],
      ],
    };
    data.deployments.unshift(deployment);
    state.deployWizardStep = 1;
    return deployment;
  }

  document.addEventListener('click', (event) => {
    const stop = event.target.closest('[data-stop-propagation]');
    const actionEl = event.target.closest('[data-action]');
    if (stop && actionEl && actionEl.contains(stop)) { event.stopPropagation(); return; }
    if (stop && !actionEl) { event.stopPropagation(); return; }
    if (!actionEl) {
      if (state.dropdown && !event.target.closest('.dropdown')) { state.dropdown = null; render(); }
      return;
    }
    const action = actionEl.dataset.action;
    const payload = parsePayload(actionEl);
    if (action !== 'command-item') event.preventDefault();

    switch (action) {
      case 'navigate': navigate(payload.path || '/overview'); break;
      case 'demo-login': navigate('/overview'); ui.toast('已进入交互原型'); break;
      case 'logout': navigate('/login'); break;
      case 'toggle-sidebar': state.sidebarOpen = !state.sidebarOpen; render(); break;
      case 'close-sidebar': state.sidebarOpen = false; render(); break;
      case 'toggle-theme': toggleTheme(payload.theme); break;
      case 'set-theme': toggleTheme(payload.theme); break;
      case 'open-command': state.commandOpen = true; state.commandQuery = ''; state.dropdown = null; render(); break;
      case 'close-command': if (event.target === actionEl) { state.commandOpen = false; render(); } break;
      case 'command-item':
        state.commandOpen = false;
        if (payload.path) navigate(payload.path);
        else if (payload.action === 'open-run-modal') { state.modal = { type:'run', payload:{repoId:101} }; render(); }
        else if (payload.action === 'open-secret-modal') { state.modal = { type:'secret', payload:{} }; render(); }
        else if (payload.action === 'open-server-register') { state.modal = { type:'serverRegister', payload:{} }; render(); }
        else if (payload.action === 'new-deployment') { prepareDeploymentDraft({}); navigate('/deployments/new'); }
        break;
      case 'open-user-menu': openDropdown('user', {}, actionEl); break;
      case 'open-repo-menu': openDropdown('repo', payload, actionEl); break;
      case 'open-pipeline-menu': openDropdown('pipeline', payload, actionEl); break;
      case 'open-notifications': state.drawer = { type:'notifications', payload:{} }; render(); break;
      case 'close-modal': state.modal = null; render(); break;
      case 'close-drawer': state.drawer = null; render(); break;
      case 'toast': ui.toast(payload.message || '操作已完成', payload.tone || 'success'); break;
      case 'refresh-data': ui.toast('数据已刷新'); actionEl.classList.add('active'); setTimeout(()=>actionEl.classList.remove('active'),400); break;
      case 'clear-repo-filters': state.filters.repoSearch='';state.filters.repoStatus='all';state.filters.repoForge='all';render();break;
      case 'wizard-next': state.wizardStep=Math.min(4,state.wizardStep+1);render();break;
      case 'wizard-prev': state.wizardStep=Math.max(1,state.wizardStep-1);render();break;
      case 'finish-repo-add': state.wizardStep=1;ui.toast('仓库已启用，Webhook 安装成功');navigate('/repos');break;
      case 'set-pr-filter': state.filters.prStatus=payload.value;render();break;
      case 'open-run-modal': state.dropdown=null;state.modal={type:'run',payload};render();break;
      case 'select-step': state.selectedStep=Number(payload.stepId);render();break;
      case 'pipeline-detail-tab': state.pipelineDetailTab=payload.tab;render();break;
      case 'toggle-pipeline-graph': state.pipelineGraph=!state.pipelineGraph;render();break;
      case 'toggle-log-errors': state.logErrorsOnly=!state.logErrorsOnly;render();break;
      case 'toggle-log-wrap': state.logWrap=!state.logWrap;render();break;
      case 'download-logs': downloadFile('pipeline-842-build.log',data.logs.map(line=>`${line[0]} ${line[2]}`).join('\n'));ui.toast('日志下载已开始');break;
      case 'retry-pipeline': {
        const p=data.pipelines.find(item=>item.id===Number(payload.pipelineId));if(p){p.status='running';p.finished='运行中';p.duration='0m 04s';}
        state.dropdown=null;render();ui.toast(`流水线 #${payload.pipelineId} 已重新运行`);setTimeout(()=>{if(p&&p.status==='running'){p.status='success';p.finished='刚刚';p.duration='3m 04s';render();ui.toast(`流水线 #${payload.pipelineId} 已成功`);}},3500);break;
      }
      case 'cancel-pipeline': {const p=data.pipelines.find(item=>item.id===Number(payload.pipelineId));if(p){p.status='canceled';p.finished='刚刚';}state.dropdown=null;render();ui.toast(`流水线 #${payload.pipelineId} 已取消`,'warning');break;}
      case 'select-diff-file': state.activeDiffFile=payload.path;render();break;
      case 'copy-text': copyText(payload.text);break;
      case 'copy-config': copyText(state.pipelineConfig || document.querySelector('[data-config-editor]')?.value || '');break;
      case 'format-config': {const editor=document.querySelector('[data-config-editor]');if(editor){state.pipelineConfig=editor.value.replace(/\t/g,'  ').replace(/\n{3,}/g,'\n\n').trim()+'\n';render();ui.toast('配置已格式化');}break;}
      case 'add-manual-var': state.manualVars.push({key:'',value:''});render();break;
      case 'remove-manual-var': state.manualVars.splice(Number(payload.index),1);render();break;
      case 'stop-debug-session': state.debugSessionActive=false;render();ui.toast('Debug 会话已终止','warning');break;
      case 'open-secret-modal': state.modal={type:'secret',payload};state.drawer=null;render();break;
      case 'open-secret': state.selectedSecretId=Number(payload.secretId);state.drawer={type:'secret',payload};render();break;
      case 'toggle-secret-reveal': {const id=Number(payload.secretId);state.revealedSecrets=state.revealedSecrets.includes(id)?state.revealedSecrets.filter(x=>x!==id):[...state.revealedSecrets,id];render();break;}
      case 'delete-secret': state.modal={type:'confirm',payload:{title:'删除 Secret',message:'将永久删除该 Secret。',detail:'引用此 Secret 的流水线可能立即失败。',confirmLabel:'删除 Secret',actionPayload:{kind:'delete-secret',secretId:Number(payload.secretId)}}};state.drawer=null;render();break;
      case 'open-audit-drawer': state.drawer={type:'audit',payload:{}};render();break;
      case 'open-registry-modal': state.modal={type:'registry',payload};render();break;
      case 'test-registry': ui.toast('镜像仓库连接验证成功');break;
      case 'open-cron-modal': state.modal={type:'cron',payload};render();break;
      case 'run-cron': ui.toast('定时任务已立即触发');break;
      case 'set-badge-style': state.badgeStyle=payload.style;render();break;
      case 'confirm-repo-action': state.dropdown=null;state.modal={type:'confirm',payload:{title:`${payload.type==='delete'?'删除':payload.type==='archive'?'归档':'禁用'}仓库`,message:'请确认高风险仓库操作。',detail:'原型不会删除真实数据，但会演示确认流程。',confirmLabel:'确认操作',actionPayload:{kind:'repo-action',...payload}}};render();break;
      case 'confirm-delete-branch': state.modal={type:'confirm',payload:{title:'删除分支',message:`删除 ${payload.branch}？`,detail:'该分支的历史流水线会保留。',confirmLabel:'删除分支',actionPayload:{kind:'delete-branch',branch:payload.branch}}};render();break;
      case 'confirm-action':
        if(payload.kind==='delete-secret'){const index=data.secrets.findIndex(s=>s.id===payload.secretId);if(index>=0)data.secrets.splice(index,1);ui.toast('Secret 已删除','warning');}
        else if(payload.kind==='repo-action'){ui.toast('仓库操作已执行','warning');}
        else if(payload.kind==='delete-branch'){const index=data.branches.findIndex(b=>b.name===payload.branch);if(index>=0)data.branches.splice(index,1);ui.toast('分支已删除','warning');navigate('/repos/101/branches');return;}
        else if(payload.kind==='revoke-server'){
          const server=getServer(payload.serverId);if(server){server.status='offline';server.health='critical';server.heartbeat='证书已吊销';server.agentVersion='revoked';data.opsEvents.unshift({id:Math.max(...data.opsEvents.map(item=>item.id))+1,serverId:server.id,type:'security',title:'Node Agent certificate revoked',detail:'alice revoked the node identity certificate.',time:'刚刚',tone:'danger'});ui.toast(`${server.name} 证书已吊销`,'warning');}
        }
        else if(payload.kind==='remove-server'){
          const index=data.servers.findIndex(item=>item.id===Number(payload.serverId));
          if(index>=0){const server=data.servers[index];data.serverGroups.forEach(group=>{group.serverIds=group.serverIds.filter(id=>id!==server.id);});data.services.splice(0,data.services.length,...data.services.filter(service=>service.serverId!==server.id));data.servers.splice(index,1);state.modal=null;ui.toast(`${server.name} 已从控制面移除`,'warning');navigate('/infrastructure/servers');return;}
        }
        else if(payload.kind==='rollback-deployment'){
          const source=getDeployment(payload.deploymentId);
          if(source&&source.previousReleaseId){
            const nextId=Math.max(...data.deployments.map(item=>item.id))+1;
            const rollback={id:nextId,applicationId:source.applicationId,environmentId:source.environmentId,releaseId:source.previousReleaseId,previousReleaseId:source.releaseId,pipelineId:source.pipelineId,status:'running',strategy:'rolling',batchSize:1,progress:0,triggeredBy:'alice',approvedBy:'alice',created:'刚刚',started:'刚刚',finished:'—',duration:'—',groupIds:[...source.groupIds],rollbackOf:source.id,currentTarget:null,targets:source.targets.map(target=>({serverId:target.serverId,status:'queued',phase:'waiting',duration:'—',message:`Waiting to roll back DEP-${source.id}`})),logs:[[clockTime(),'warning',`Rollback created for DEP-${source.id}`],[clockTime(),'info',`Target release ${getRelease(source.previousReleaseId)?.version||source.previousReleaseId}`]]};
            data.deployments.unshift(rollback);state.modal=null;ui.toast(`回滚部署 DEP-${rollback.id} 已开始`,'warning');navigate(`/deployments/${rollback.id}`);scheduleDeployment(rollback.id,900);return;
          }
        }
        state.modal=null;render();break;
      case 'download-repo-export': downloadFile(`repository-${payload.repoId}-export.json`,JSON.stringify({repository:data.repositories.find(r=>r.id===payload.repoId),pipelines:data.pipelines},null,2),'application/json');ui.toast('仓库导出已生成');break;
      case 'open-agent': state.drawer={type:'agent',payload};render();break;
      case 'open-agent-install': state.modal={type:'agentInstall',payload:{}};render();break;
      case 'open-user-modal': state.modal={type:'user',payload};render();break;
      case 'toggle-user-active': {const u=data.users.find(item=>item.id===Number(payload.userId));if(u)u.active=!u.active;render();ui.toast('用户状态已更新');break;}
      case 'open-org-modal': state.modal={type:'org',payload};render();break;
      case 'promote-queue': {const q=data.queue.find(item=>item.id===Number(payload.taskId));if(q)q.priority=100;render();ui.toast('任务已提升到队首');break;}
      case 'cancel-queue': {const i=data.queue.findIndex(item=>item.id===Number(payload.taskId));if(i>=0)data.queue.splice(i,1);render();ui.toast('队列任务已取消','warning');break;}
      case 'toggle-queue-pause': state.queuePaused=!state.queuePaused;render();ui.toast(state.queuePaused?'调度器已暂停':'调度器已恢复',state.queuePaused?'warning':'success');break;
      case 'test-forge': ui.toast('Forge OAuth 与 Webhook 连接正常');break;
      case 'open-system-settings': state.modal={type:'systemSettings',payload:{}};render();break;
      case 'generate-api-token': state.apiToken=`wp_pat_${Math.random().toString(36).slice(2,11)}_${Math.random().toString(36).slice(2,9)}`;render();ui.toast('新 Token 已生成');break;
      case 'approve-cli': state.cliApproved=true;render();break;
      case 'open-server-register': state.modal={type:'serverRegister',payload};render();break;
      case 'open-server-group-modal': state.modal={type:'serverGroup',payload};render();break;
      case 'open-application-modal': state.modal={type:'application',payload};render();break;
      case 'open-environment-modal': state.modal={type:'environment',payload};render();break;
      case 'new-deployment': prepareDeploymentDraft(payload);navigate('/deployments/new');break;
      case 'deployment-wizard-prev': state.deployWizardStep=Math.max(1,state.deployWizardStep-1);render();break;
      case 'deployment-wizard-next': {
        const draft=state.deploymentDraft;
        if(state.deployWizardStep===1&&!draft.applicationId){ui.toast('请选择应用','warning');break;}
        if(state.deployWizardStep===2&&!draft.releaseId){ui.toast('请选择 Release','warning');break;}
        if(state.deployWizardStep===3&&(!draft.environmentId||!draft.groupId)){ui.toast('请选择环境和目标服务器组','warning');break;}
        state.deployWizardStep=Math.min(5,state.deployWizardStep+1);render();break;
      }
      case 'start-deployment': {
        const deployment=createDeploymentFromDraft();
        if(!deployment)break;
        navigate(`/deployments/${deployment.id}`);
        ui.toast(deployment.status==='waiting_approval'?`部署 DEP-${deployment.id} 已提交审批`:`部署 DEP-${deployment.id} 已开始`,deployment.status==='waiting_approval'?'warning':'success');
        if(deployment.status==='running')scheduleDeployment(deployment.id,900);
        break;
      }
      case 'approve-deployment': {
        const deployment=getDeployment(payload.deploymentId);
        if(!deployment)break;
        deployment.status='running';deployment.approvedBy='alice';deployment.started='刚刚';
        deployment.targets.forEach((target)=>{if(target.status==='queued'){target.phase='waiting';target.message='Approval granted; waiting to deploy';}});
        addDeploymentLog(deployment,'success','Deployment approved by alice');
        render();ui.toast(`DEP-${deployment.id} 已批准并开始部署`);scheduleDeployment(deployment.id,900);break;
      }
      case 'reject-deployment': {
        const deployment=getDeployment(payload.deploymentId);
        if(!deployment)break;
        deployment.status='canceled';deployment.finished='刚刚';deployment.targets.forEach((target)=>{if(target.status==='queued'){target.status='canceled';target.phase='rejected';target.message='Deployment approval rejected';}});
        addDeploymentLog(deployment,'danger','Deployment approval rejected by alice');render();ui.toast(`DEP-${deployment.id} 已拒绝`,'warning');break;
      }
      case 'pause-deployment': {
        const deployment=getDeployment(payload.deploymentId);if(!deployment)break;
        clearTimeout(state.deploymentTimers[deployment.id]);delete state.deploymentTimers[deployment.id];deployment.status='paused';
        addDeploymentLog(deployment,'warning','Deployment paused by alice');render();ui.toast(`DEP-${deployment.id} 已暂停`,'warning');break;
      }
      case 'resume-deployment': {
        const deployment=getDeployment(payload.deploymentId);if(!deployment)break;
        deployment.status='running';addDeploymentLog(deployment,'info','Deployment resumed by alice');render();ui.toast(`DEP-${deployment.id} 已恢复`);scheduleDeployment(deployment.id,900);break;
      }
      case 'advance-deployment': advanceDeployment(payload.deploymentId,false);break;
      case 'cancel-deployment': {
        const deployment=getDeployment(payload.deploymentId);if(!deployment)break;
        clearTimeout(state.deploymentTimers[deployment.id]);delete state.deploymentTimers[deployment.id];deployment.status='canceled';deployment.finished='刚刚';
        deployment.targets.forEach((target)=>{if(['queued','running','deploying'].includes(target.status)){target.status='canceled';target.phase='canceled';target.message='Canceled by alice';}});
        addDeploymentLog(deployment,'danger','Deployment canceled by alice');render();ui.toast(`DEP-${deployment.id} 已取消`,'warning');break;
      }
      case 'rollback-deployment': {
        const deployment=getDeployment(payload.deploymentId);if(!deployment||!deployment.previousReleaseId){ui.toast('没有可用的上一版本','warning');break;}
        const previous=getRelease(deployment.previousReleaseId);
        state.modal={type:'confirm',payload:{title:'回滚部署',subtitle:`DEP-${deployment.id}`,message:`将 ${getApplication(deployment.applicationId)?.name||'应用'} 回滚到 ${previous?.version||'上一版本'}。`,detail:'系统会创建一条新的滚动部署记录，并对每个节点重新执行健康检查。',confirmLabel:'创建回滚部署',actionPayload:{kind:'rollback-deployment',deploymentId:deployment.id}}};render();break;
      }
      case 'retry-deployment-target': {
        const deployment=getDeployment(payload.deploymentId);const target=deployment?.targets.find((item)=>item.serverId===Number(payload.serverId));
        if(!deployment||!target)break;
        const server=getServer(target.serverId);if(server){server.status='online';server.health='healthy';server.heartbeat='刚刚';}
        target.status='running';target.phase='deploying';target.message='Retrying deployment';deployment.status='running';deployment.finished='—';
        addDeploymentLog(deployment,'info',`${server?.name||target.serverId}: retry requested by alice`);render();ui.toast(`正在重试 ${server?.name||'目标节点'}`);
        setTimeout(()=>{target.status='success';target.phase='healthy';target.message='Health check passed';target.duration='1m 12s';addDeploymentLog(deployment,'success',`${server?.name||target.serverId}: retry succeeded`);if(deployment.targets.every((item)=>item.status==='success')){deployment.status='success';deployment.progress=100;deployment.finished='刚刚';markDeploymentRelease(deployment);ui.toast(`部署 DEP-${deployment.id} 已恢复`);}renderIfDeploymentVisible(deployment.id);},1700);break;
      }
      case 'download-deployment-logs': {
        const deployment=getDeployment(payload.deploymentId);if(!deployment)break;
        downloadFile(`deployment-${deployment.id}.log`,deployment.logs.map((line)=>line.join(' ')).join('\n'));ui.toast('部署日志下载已开始');break;
      }
      case 'toggle-server-maintenance': {
        const server=getServer(payload.serverId);if(!server)break;
        server.maintenance=!server.maintenance;server.status=server.maintenance?'maintenance':'online';server.health=server.maintenance?'maintenance':'healthy';
        data.opsEvents.unshift({id:Math.max(...data.opsEvents.map((item)=>item.id))+1,serverId:server.id,type:'maintenance',title:server.maintenance?'Maintenance mode enabled':'Maintenance mode disabled',detail:`alice ${server.maintenance?'drained workloads and disabled deployment scheduling':'returned the node to deployment scheduling'}.`,time:'刚刚',tone:server.maintenance?'info':'success'});
        render();ui.toast(`${server.name} 已${server.maintenance?'进入':'退出'}维护模式`,server.maintenance?'warning':'success');break;
      }
      case 'restart-node-agent': {
        const server=getServer(payload.serverId);if(!server)break;
        server.heartbeat='正在重连';render();ui.toast(`正在重启 ${server.name} Node Agent`);
        setTimeout(()=>{server.status='online';server.health=server.maintenance?'maintenance':'healthy';server.heartbeat='刚刚';renderIfDeploymentVisible(-1);if(parseRoute().name==='infrastructureServer')render();ui.toast(`${server.name} Node Agent 已恢复`);},1200);break;
      }
      case 'copy-server-diagnostics': {
        const server=getServer(payload.serverId);if(!server)break;
        copyText(JSON.stringify({name:server.name,status:server.status,health:server.health,ip:server.ip,os:server.os,kernel:server.kernel,runtime:server.runtime,agentVersion:server.agentVersion,cpu:server.cpu,memory:server.memory,disk:server.disk,heartbeat:server.heartbeat,labels:server.labels},null,2));break;
      }
      case 'restart-service': {
        const service=data.services.find((item)=>item.id===Number(payload.serviceId));if(!service)break;
        service.status='deploying';service.restarts+=1;service.uptime='0 秒';render();ui.toast(`${service.name} 正在重启`);
        setTimeout(()=>{service.status='healthy';service.uptime='刚刚';render();ui.toast(`${service.name} 已恢复`);},1300);break;
      }
      case 'revoke-server-certificate': {
        const server=getServer(payload.serverId);if(!server)break;
        state.modal={type:'confirm',payload:{title:'吊销节点证书',message:`${server.name} 将立即与控制面断开。`,detail:'需要重新生成一次性注册令牌后，Node Agent 才能再次连接。',confirmLabel:'吊销证书',actionPayload:{kind:'revoke-server',serverId:server.id}}};render();break;
      }
      case 'remove-server': {
        const server=getServer(payload.serverId);if(!server)break;
        state.modal={type:'confirm',payload:{title:'移除服务器',message:`从控制面移除 ${server.name}？`,detail:'此操作不会停止服务器上的容器或删除业务数据，但部署历史会保留。',confirmLabel:'移除服务器',actionPayload:{kind:'remove-server',serverId:server.id}}};render();break;
      }
      case 'set-alert-filter': state.filters.alertStatus=payload.status||'all';render();break;
      case 'ack-alert': {
        const alert=data.alerts.find((item)=>item.id===Number(payload.alertId));if(alert){alert.status='acknowledged';alert.acknowledgedBy='alice';}render();ui.toast('告警已确认');break;
      }
      case 'resolve-alert': {
        const alert=data.alerts.find((item)=>item.id===Number(payload.alertId));if(alert){alert.status='resolved';alert.resolvedBy='alice';}render();ui.toast('告警已解决');break;
      }
      default: break;
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.matches('[data-filter]')) {
      const key = target.dataset.filter;
      state.filters[key] = target.value;
      render(target.dataset.preserve || key);
    } else if (target.matches('[data-log-search]')) {
      state.logSearch = target.value;
      render('logSearch');
    } else if (target.matches('[data-command-query]')) {
      state.commandQuery = target.value;
      render();
    } else if (target.matches('[data-config-editor]')) {
      state.pipelineConfig = target.value;
    } else if (target.matches('[data-queue-priority]')) {
      const task = data.queue.find((q)=>q.id===Number(target.dataset.queuePriority));
      if (task) task.priority = Number(target.value);
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (target.matches('[data-filter]')) {
      state.filters[target.dataset.filter] = target.value;
      render();
    } else if (target.matches('[data-select-repo]')) {
      const id = Number(target.dataset.selectRepo);
      state.selectedRepoIds = target.checked ? [...new Set([...state.selectedRepoIds,id])] : state.selectedRepoIds.filter(x=>x!==id);
    } else if (target.matches('[data-toggle-cron]')) {
      const cron=data.crons.find(c=>c.id===Number(target.dataset.toggleCron));if(cron)cron.active=target.checked;ui.toast('定时任务状态已更新');
    } else if (target.matches('[data-toggle-extension]')) {
      const ext=state.extensions.find(e=>e.id===target.dataset.toggleExtension);if(ext)ext.enabled=target.checked;ui.toast(`${ext?.name||'扩展'}已${target.checked?'启用':'停用'}`);
    } else if (target.matches('[data-deployment-draft]')) {
      const key=target.dataset.deploymentDraft;
      const numericKeys=['applicationId','releaseId','environmentId','groupId','batchSize'];
      state.deploymentDraft[key]=numericKeys.includes(key)?Number(target.value):target.value;
      if(key==='applicationId'){
        const app=getApplication(state.deploymentDraft.applicationId);
        const release=data.releases.find(item=>item.applicationId===app.id&&item.status==='ready')||data.releases.find(item=>item.applicationId===app.id);
        if(release)state.deploymentDraft.releaseId=release.id;
        const env=getEnvironment(state.deploymentDraft.environmentId)||getEnvironment(app.environmentIds[0]);
        if(env){state.deploymentDraft.environmentId=env.id;const group=groupForApplication(app,env);if(group){state.deploymentDraft.groupId=group.id;state.deploymentDraft.strategy=group.strategy;state.deploymentDraft.batchSize=group.batchSize;}}
      }
      if(key==='environmentId'){
        const app=getApplication(state.deploymentDraft.applicationId);const env=getEnvironment(state.deploymentDraft.environmentId);const group=groupForApplication(app,env);
        if(group){state.deploymentDraft.groupId=group.id;state.deploymentDraft.strategy=group.strategy;state.deploymentDraft.batchSize=group.batchSize;}
      }
      if(key==='groupId'){
        const group=data.serverGroups.find(item=>item.id===Number(state.deploymentDraft.groupId));if(group){state.deploymentDraft.strategy=group.strategy;state.deploymentDraft.batchSize=group.batchSize;}
      }
      render();
    } else if (target.matches('[data-toggle-deployment-policy]')) {
      const policy=data.deploymentPolicies.find(item=>item.id===Number(target.dataset.toggleDeploymentPolicy));if(policy)policy.active=target.checked;render();ui.toast(`部署策略已${target.checked?'启用':'停用'}`);
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    const fd = new FormData(form);
    const kind = form.dataset.form;
    if (kind === 'login') { navigate('/overview'); ui.toast('登录成功'); return; }
    if (kind === 'run-pipeline') {
      const repoId=Number(fd.get('repoId'));const nextId=Math.max(...data.pipelines.map(p=>p.id))+1;
      data.pipelines.unshift({id:nextId,repoId,status:'queued',branch:String(fd.get('branch')),event:String(fd.get('event')),author:'alice',avatar:'A',commit:'manual',message:String(fd.get('message')||'Manual run'),duration:'—',queued:'0s',finished:'等待中',created:new Date().toISOString(),errors:0,warnings:0});
      state.modal=null;ui.toast(`流水线 #${nextId} 已加入队列`);navigate(`/repos/${repoId}`);return;
    }
    if (kind === 'manual-run') {
      const nextId=Math.max(...data.pipelines.map(p=>p.id))+1;data.pipelines.unshift({id:nextId,repoId:101,status:'queued',branch:String(fd.get('branch')),event:String(fd.get('event')),author:'alice',avatar:'A',commit:'manual',message:String(fd.get('message')||'Manual run'),duration:'—',queued:'0s',finished:'等待中',created:new Date().toISOString(),errors:0,warnings:0});ui.toast(`流水线 #${nextId} 已运行`);navigate('/repos/101');return;
    }
    if (kind === 'repo-settings') { ui.toast('仓库设置已保存'); return; }
    if (kind === 'comment') { form.reset();ui.toast('评论已发布');return; }
    if (kind === 'debug-session') { state.debugSessionActive=true;render();ui.toast('Debug 会话已启动');return; }
    if (kind === 'secret') {
      const id=Number(fd.get('secretId'))||null;const existing=data.secrets.find(s=>s.id===id);
      if(existing){existing.name=String(fd.get('name'));existing.value=String(fd.get('value'));existing.type=String(fd.get('type'));existing.scope=String(fd.get('scope'));existing.updated='刚刚';}
      else data.secrets.unshift({id:Math.max(...data.secrets.map(s=>s.id))+1,name:String(fd.get('name')),value:String(fd.get('value')),type:String(fd.get('type')),scope:String(fd.get('scope')),used:0,updated:'刚刚',user:'alice',permission:'Write',repositories:['acme/backend-api']});
      state.modal=null;render();ui.toast(existing?'Secret 已更新':'Secret 已创建');return;
    }
    if (kind === 'registry') {
      const id=Number(fd.get('registryId'))||null;const existing=data.registries.find(r=>r.id===id);
      if(existing){existing.address=String(fd.get('address'));existing.username=String(fd.get('username'));existing.scope=String(fd.get('scope'));existing.updated='刚刚';existing.verified=true;}
      else data.registries.unshift({id:Math.max(...data.registries.map(r=>r.id))+1,address:String(fd.get('address')),username:String(fd.get('username')),scope:String(fd.get('scope')),type:'Private Registry',updated:'刚刚',verified:true});
      state.modal=null;render();ui.toast('镜像仓库已保存');return;
    }
    if (kind === 'cron') {
      const id=Number(fd.get('cronId'))||null;const existing=data.crons.find(c=>c.id===id);
      if(existing){existing.name=String(fd.get('name'));existing.schedule=String(fd.get('schedule'));existing.branch=String(fd.get('branch'));}
      else data.crons.unshift({id:Math.max(...data.crons.map(c=>c.id))+1,name:String(fd.get('name')),schedule:String(fd.get('schedule')),branch:String(fd.get('branch')),next:'今天 02:00',active:true,lastStatus:'success'});
      state.modal=null;render();ui.toast('定时任务已保存');return;
    }
    if (kind === 'user') {
      const id=Number(fd.get('userId'))||null;const existing=data.users.find(u=>u.id===id);
      if(existing){existing.name=String(fd.get('name'));existing.email=String(fd.get('email'));existing.login=String(fd.get('login'));existing.admin=fd.get('admin')==='on';existing.active=fd.get('active')==='on';}
      else data.users.unshift({id:Math.max(...data.users.map(u=>u.id))+1,name:String(fd.get('name')),email:String(fd.get('email')),login:String(fd.get('login')),admin:fd.get('admin')==='on',active:true,forge:'Invite',lastLogin:'从未',pipelines:0});
      state.modal=null;render();ui.toast('用户已保存');return;
    }
    if (kind === 'org') {
      const id=Number(fd.get('orgId'))||null;const existing=data.organizations.find(o=>o.id===id);
      if(existing){existing.name=String(fd.get('name'));existing.slug=String(fd.get('slug'));}
      else data.organizations.unshift({id:Math.max(...data.organizations.map(o=>o.id))+1,name:String(fd.get('name')),slug:String(fd.get('slug')),repos:0,members:1,successRate:100,activity:'刚刚',role:'Owner'});
      state.modal=null;render();ui.toast('组织已保存');return;
    }
    if (kind === 'server-register') {
      const group=data.serverGroups.find(item=>item.id===Number(fd.get('groupId')))||data.serverGroups[0];
      const id=Math.max(...data.servers.map(item=>item.id))+1;
      const server={id,name:String(fd.get('name')),status:'online',health:'healthy',groupId:group.id,environmentId:group.environmentId,region:String(fd.get('region')),zone:String(fd.get('zone')),ip:String(fd.get('ip')),publicIp:'—',os:String(fd.get('os')),kernel:'6.8.0-generic',cpu:4,memory:9,disk:18,load:0.12,uptime:'刚刚',heartbeat:'刚刚',agentVersion:'1.2.0',runtime:'Docker 27.1',containersRunning:0,containersTotal:0,currentReleaseId:data.releases.find(item=>item.status==='deployed')?.id||data.releases[0].id,labels:String(fd.get('labels')||'').split(',').map(item=>item.trim()).filter(Boolean),maintenance:false,metrics:{cpu:[0,0,1,2,3,4],memory:[7,8,8,9,9,9],disk:[18,18,18,18,18,18],network:[0,1,1,2,1,1]}};
      data.servers.push(server);group.serverIds.push(id);data.opsEvents.unshift({id:Math.max(...data.opsEvents.map(item=>item.id))+1,serverId:id,type:'registration',title:'Node Agent registered',detail:'Server identity verified with mTLS.',time:'刚刚',tone:'success'});
      state.modal=null;ui.toast(`${server.name} 已连接`);navigate(`/infrastructure/servers/${id}`);return;
    }
    if (kind === 'server-group') {
      const id=Number(fd.get('groupId'))||null;let group=data.serverGroups.find(item=>item.id===id);
      const environmentId=Number(fd.get('environmentId'));
      if(group){const oldEnv=data.environments.find(env=>env.groupIds.includes(group.id));if(oldEnv&&oldEnv.id!==environmentId)oldEnv.groupIds=oldEnv.groupIds.filter(groupId=>groupId!==group.id);Object.assign(group,{name:String(fd.get('name')),description:String(fd.get('description')),environmentId,strategy:String(fd.get('strategy')),batchSize:Number(fd.get('batchSize')),port:Number(fd.get('port')),healthPath:String(fd.get('healthPath')),labels:String(fd.get('labels')||'').split(',').map(item=>item.trim()).filter(Boolean)});}
      else{group={id:Math.max(...data.serverGroups.map(item=>item.id))+1,name:String(fd.get('name')),description:String(fd.get('description')),environmentId,strategy:String(fd.get('strategy')),batchSize:Number(fd.get('batchSize')),port:Number(fd.get('port')),healthPath:String(fd.get('healthPath')),labels:String(fd.get('labels')||'').split(',').map(item=>item.trim()).filter(Boolean),serverIds:[]};data.serverGroups.push(group);}
      const env=getEnvironment(environmentId);if(env&&!env.groupIds.includes(group.id))env.groupIds.push(group.id);
      state.modal=null;render();ui.toast('服务器组已保存');return;
    }
    if (kind === 'application') {
      const id=Number(fd.get('applicationId'))||null;let application=getApplication(id);
      const values={name:String(fd.get('name')),repoId:Number(fd.get('repoId')),description:String(fd.get('description')||''),image:String(fd.get('image')),runtime:String(fd.get('runtime')),composeFile:String(fd.get('composeFile')||''),service:String(fd.get('service')),owner:String(fd.get('owner')||'Platform'),healthPath:String(fd.get('healthPath')),environmentIds:[1,2]};
      if(application)Object.assign(application,values);else{application={id:Math.max(...data.applications.map(item=>item.id))+1,...values,currentProductionReleaseId:data.releases.find(item=>item.status==='deployed')?.id||data.releases[0].id,currentStagingReleaseId:data.releases.find(item=>item.status==='ready')?.id||data.releases[0].id};data.applications.push(application);}
      state.modal=null;render();ui.toast('应用已保存');return;
    }
    if (kind === 'environment') {
      const id=Number(fd.get('environmentId'))||null;let environment=getEnvironment(id);
      const values={title:String(fd.get('title')),name:String(fd.get('name')),domain:String(fd.get('domain')||''),deployWindow:String(fd.get('deployWindow')||'Any time'),minimumApprovers:Number(fd.get('minimumApprovers')||0),policyId:Number(fd.get('policyId')),protected:fd.get('protected')==='on',approvalRequired:fd.get('approvalRequired')==='on',autoRollback:fd.get('autoRollback')==='on'};
      if(environment)Object.assign(environment,values);else{environment={id:Math.max(...data.environments.map(item=>item.id))+1,...values,groupIds:[],color:values.protected?'danger':'info'};data.environments.push(environment);}
      state.modal=null;render();ui.toast('环境已保存');return;
    }
    if (kind === 'server-settings') {
      const server=getServer(fd.get('serverId'));if(!server)return;
      const oldGroup=data.serverGroups.find(item=>item.id===server.groupId);const nextGroup=data.serverGroups.find(item=>item.id===Number(fd.get('groupId')))||oldGroup;
      if(oldGroup&&nextGroup&&oldGroup.id!==nextGroup.id){oldGroup.serverIds=oldGroup.serverIds.filter(id=>id!==server.id);if(!nextGroup.serverIds.includes(server.id))nextGroup.serverIds.push(server.id);}
      server.name=String(fd.get('name'));server.groupId=nextGroup.id;server.environmentId=nextGroup.environmentId;server.region=String(fd.get('region'));server.zone=String(fd.get('zone'));server.labels=String(fd.get('labels')||'').split(',').map(item=>item.trim()).filter(Boolean);
      render();ui.toast('节点配置已保存');return;
    }
    if (kind === 'forge-create') { ui.toast('Forge 已创建并通过连接测试');navigate('/admin/forges');return; }
    if (kind === 'forge-settings') { ui.toast('Forge 设置已保存');return; }
    if (kind === 'system-settings') { state.modal=null;render();ui.toast('系统设置已保存');return; }
    if (kind === 'user-settings') { ui.toast('个人设置已保存');return; }
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault();state.commandOpen=true;state.commandQuery='';render(); }
    if (event.key === 'Escape') {
      if (state.commandOpen) state.commandOpen=false;
      else if (state.modal) state.modal=null;
      else if (state.drawer) state.drawer=null;
      else if (state.dropdown) state.dropdown=null;
      else if (state.sidebarOpen) state.sidebarOpen=false;
      else return;
      render();
    }
    if (state.commandOpen && event.key === 'Enter') {
      const first=document.querySelector('.command-item');if(first)first.click();
    }
  });

  window.addEventListener('hashchange', () => { state.dropdown=null;state.modal=null;state.drawer=null;state.sidebarOpen=false;render();window.scrollTo(0,0); });
  window.addEventListener('resize', () => { if(state.dropdown){state.dropdown=null;render();} });

  if (!location.hash) location.hash = '/overview';
  else render();
})();
