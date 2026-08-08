(function () {
  const paths = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-6h6v6"/>',
    repo: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 5.5v15"/><path d="M8 7h8"/>',
    pipeline: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="19" r="2"/><path d="M8 5h3a3 3 0 0 1 3 3v1a3 3 0 0 0 3 3"/><path d="M8 19h3a3 3 0 0 0 3-3v-1a3 3 0 0 1 3-3"/>',
    branch: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7v10"/><path d="M8 7c5 0 4-1 8-1"/>',
    pr: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M6 7v10"/><path d="m14 5 4 4 4-4"/><path d="M18 9v8"/>',
    agent: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/><path d="M7 9h.01M11 9h.01"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8"/><path d="m17 6 2 2"/><path d="m14 9 2 2"/>',
    variable: '<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/>',
    trigger: '<path d="m13 2-9 12h7l-1 8 9-12h-7z"/>',
    template: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.2H9.6V21a1.7 1.7 0 0 0-.4-1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.9.3l-.1.1L3.4 17l.1-.1A1.7 1.7 0 0 0 3.8 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H2V9.6h.2a1.7 1.7 0 0 0 1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L6.2 3.4l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V2h4v.2a1.7 1.7 0 0 0 .4 1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1 .4h.2v4H21a1.7 1.7 0 0 0-1 .4 1.7 1.7 0 0 0-.6 1z"/>',
    organization: '<circle cx="9" cy="8" r="3"/><circle cx="18" cy="9" r="2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M15 15a4 4 0 0 1 6 3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M14 16a5 5 0 0 1 7 4"/>',
    queue: '<path d="M4 6h12M4 12h16M4 18h10"/><path d="m17 4 3 2-3 2M15 16l3 2-3 2"/>',
    forge: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="5"/><path d="m5.6 5.6 2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.6 2.6 0 1 1 3.7 2.4c-.9.4-1.3 1-1.3 2.1"/><path d="M12 17h.01"/>',
    command: '<path d="M9 6V4a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v16a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2z"/>',
    moon: '<path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    retry: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    filter: '<path d="M4 5h16l-6 7v5l-4 2v-7z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    warning: '<path d="M10.3 3.7 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
    file: '<path d="M5 3h9l5 5v13H5z"/><path d="M14 3v6h6"/>',
    graph: '<path d="M4 18V9M10 18V5M16 18v-7M22 18H2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="m3 3 18 18"/><path d="M10.6 5.2A10.5 10.5 0 0 1 12 5c6 0 10 7 10 7a18 18 0 0 1-2.1 3.1M6.6 6.6C3.8 8.5 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 4.1-.9"/>',
    trash: '<path d="M3 6h18M8 6V3h8v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
    external: '<path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8M10 12h4"/>',
    shield: '<path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/>',
    upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
    memory: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 10h8M8 14h5M7 3v3M12 3v3M17 3v3M7 18v3M12 18v3M17 18v3"/>',
    disk: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    network: '<circle cx="12" cy="12" r="3"/><path d="M5.6 5.6a9 9 0 0 1 12.8 0M8.5 8.5a5 5 0 0 1 7 0M5.6 18.4a9 9 0 0 0 12.8 0M8.5 15.5a5 5 0 0 0 7 0"/>',
    container: '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 7 9 5 9-5v10l-9 5-9-5z"/><path d="M12 12v10"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.5-2 5-2 5s3.5-.5 5-2"/><path d="M9 15 4 10c4-7 10-8 17-7-1 7-2 13-9 17z"/><circle cx="15" cy="9" r="2"/><path d="M8 18H4v-4M14 12l-5 5"/>',
    app: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    environment: '<path d="M12 21s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
    package: '<path d="m12 2 8 4-8 4-8-4z"/><path d="m4 6 8 4 8-4v10l-8 4-8-4z"/><path d="M12 10v10"/>',
    alert: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4M12 5v5M12 13h.01"/>',
    activity: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6M12 7v5l3 2"/>',
    rollback: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5-5l2.1 2.1-3.4 3.4-2.1-2.1a4 4 0 0 0 5 5L4 17l3 3 7.3-7.3a4 4 0 0 0 5-5l-2.1 2.1-3.4-3.4z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
  };

  const status = {
    success: { label: '成功', tone: 'success', icon: 'check' },
    failure: { label: '失败', tone: 'danger', icon: 'x' },
    warning: { label: '警告', tone: 'warning', icon: 'warning' },
    running: { label: '运行中', tone: 'info', icon: 'play' },
    queued: { label: '等待中', tone: 'pending', icon: 'clock' },
    canceled: { label: '已取消', tone: 'neutral', icon: 'stop' },
    blocked: { label: '阻塞', tone: 'danger', icon: 'lock' },
    online: { label: '在线', tone: 'success', icon: 'check' },
    busy: { label: '忙碌', tone: 'warning', icon: 'play' },
    idle: { label: '空闲', tone: 'neutral', icon: 'clock' },
    offline: { label: '离线', tone: 'danger', icon: 'x' },
    open: { label: '开放', tone: 'info', icon: 'pr' },
    merged: { label: '已合并', tone: 'purple', icon: 'check' },
    connected: { label: '已连接', tone: 'success', icon: 'check' },
    degraded: { label: '异常', tone: 'warning', icon: 'warning' },
    healthy: { label: '健康', tone: 'success', icon: 'check' },
    critical: { label: '严重', tone: 'danger', icon: 'alert' },
    maintenance: { label: '维护中', tone: 'info', icon: 'wrench' },
    deploying: { label: '部署中', tone: 'info', icon: 'rocket' },
    unreachable: { label: '不可达', tone: 'danger', icon: 'x' },
    stopped: { label: '已停止', tone: 'neutral', icon: 'stop' },
    ready: { label: '可部署', tone: 'success', icon: 'package' },
    deployed: { label: '已部署', tone: 'info', icon: 'check' },
    waiting_approval: { label: '等待审批', tone: 'pending', icon: 'lock' },
    paused: { label: '已暂停', tone: 'warning', icon: 'pause' },
    rollback: { label: '回滚中', tone: 'warning', icon: 'rollback' },
    active: { label: '活动', tone: 'danger', icon: 'alert' },
    acknowledged: { label: '已确认', tone: 'warning', icon: 'check' },
    resolved: { label: '已解决', tone: 'success', icon: 'check' },
    approved: { label: '已批准', tone: 'success', icon: 'check' },
    rejected: { label: '已拒绝', tone: 'danger', icon: 'x' },
  };

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function icon(name, size = 18, className = '') {
    return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
  }

  function logo(size = 34) {
    return `<span class="brand-mark" style="width:${size}px;height:${size}px" aria-hidden="true"><svg viewBox="0 0 48 48" width="${size}" height="${size}"><path fill="currentColor" d="M38 8c-7 0-13 2-18 7-4 4-6 9-6 15-4-1-7-3-9-6 1 8 6 14 14 16 5 1 11 0 15-4-4 1-8 0-11-2 7-1 12-5 15-11l6-2-5-3c1-4 1-7-1-10Z"/><path fill="var(--bg-app)" d="M30 17c-4 1-7 4-8 8 3-2 7-3 11-2 2-3 2-5-3-6Z"/><circle cx="35" cy="14" r="2.3" fill="var(--bg-app)"/></svg></span>`;
  }

  function badge(value, options = {}) {
    const meta = status[value] || { label: options.label || value, tone: options.tone || 'neutral', icon: options.icon };
    const label = options.label || meta.label;
    const withIcon = options.icon === false ? '' : icon(options.icon || meta.icon || 'info', 13);
    return `<span class="badge badge-${options.tone || meta.tone}">${withIcon}<span>${esc(label)}</span></span>`;
  }

  function avatar(name, size = 'md') {
    const letter = String(name || '?').slice(0, 1).toUpperCase();
    const hue = (letter.charCodeAt(0) * 29) % 360;
    return `<span class="avatar avatar-${size}" style="--avatar-h:${hue}">${esc(letter)}</span>`;
  }

  function progress(value, tone = '') {
    return `<div class="progress ${tone ? `progress-${tone}` : ''}"><span style="width:${Math.max(0, Math.min(100, Number(value) || 0))}%"></span></div>`;
  }

  function sparkline(values, options = {}) {
    const width = options.width || 150;
    const height = options.height || 42;
    const points = values.map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const y = height - 4 - ((value - min) / Math.max(1, max - min)) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<svg class="sparkline ${options.className || ''}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/><polyline points="0,${height} ${points} ${width},${height}" fill="currentColor" opacity=".08" stroke="none"/></svg>`;
  }

  function metricCard({ label, value, delta, tone = 'success', iconName, chart, hint }) {
    return `<article class="metric-card">
      <div class="metric-head"><span>${esc(label)}</span>${iconName ? `<span class="metric-icon">${icon(iconName, 17)}</span>` : icon('info', 14, 'muted')}</div>
      <div class="metric-body"><div><strong>${esc(value)}</strong>${delta ? `<small class="delta delta-${tone}">${esc(delta)}</small>` : ''}${hint ? `<p>${esc(hint)}</p>` : ''}</div>${chart ? sparkline(chart, { width: 118, height: 46 }) : ''}</div>
    </article>`;
  }

  function emptyState(title, description, action) {
    return `<div class="empty-state"><div class="empty-icon">${icon('repo', 28)}</div><h3>${esc(title)}</h3><p>${esc(description)}</p>${action || ''}</div>`;
  }

  function field(label, input, help = '') {
    return `<label class="field"><span class="field-label">${esc(label)}</span>${input}${help ? `<small>${esc(help)}</small>` : ''}</label>`;
  }

  function input(name, value = '', options = {}) {
    const type = options.type || 'text';
    return `<input class="input" type="${esc(type)}" name="${esc(name)}" value="${esc(value)}" placeholder="${esc(options.placeholder || '')}" ${options.required ? 'required' : ''} ${options.disabled ? 'disabled' : ''} ${options.preserve ? `data-preserve="${esc(options.preserve)}"` : ''}/>`;
  }

  function select(name, values, current, options = {}) {
    return `<select class="select" name="${esc(name)}" ${options.preserve ? `data-preserve="${esc(options.preserve)}"` : ''}>${values.map((value) => {
      const item = typeof value === 'string' ? { value, label: value } : value;
      return `<option value="${esc(item.value)}" ${String(item.value) === String(current) ? 'selected' : ''}>${esc(item.label)}</option>`;
    }).join('')}</select>`;
  }

  function button(label, options = {}) {
    const type = options.type || 'button';
    return `<button type="${type}" class="btn ${options.variant ? `btn-${options.variant}` : ''} ${options.size ? `btn-${options.size}` : ''}" ${options.action ? `data-action="${esc(options.action)}"` : ''} ${options.payload ? `data-payload="${esc(JSON.stringify(options.payload))}"` : ''} ${options.disabled ? 'disabled' : ''}>${options.icon ? icon(options.icon, options.iconSize || 16) : ''}<span>${esc(label)}</span>${options.trailingIcon ? icon(options.trailingIcon, 15) : ''}</button>`;
  }

  function pageHeader(title, description, actions = '', eyebrow = '') {
    return `<header class="page-header"><div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h1>${esc(title)}</h1>${description ? `<p>${esc(description)}</p>` : ''}</div><div class="page-actions">${actions}</div></header>`;
  }

  function tabs(items, active) {
    return `<nav class="tabs" aria-label="页面标签">${items.map((item) => `<a href="${esc(item.href)}" class="tab ${item.key === active ? 'active' : ''}">${item.icon ? icon(item.icon, 16) : ''}<span>${esc(item.label)}</span>${item.count != null ? `<span class="tab-count">${esc(item.count)}</span>` : ''}</a>`).join('')}</nav>`;
  }

  function statLine(label, value, options = {}) {
    return `<div class="stat-line"><span>${esc(label)}</span><strong class="${options.tone ? `text-${options.tone}` : ''}">${esc(value)}</strong></div>`;
  }

  function toast(message, tone = 'success') {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = `toast toast-${tone}`;
    el.innerHTML = `${icon(tone === 'danger' ? 'x' : tone === 'warning' ? 'warning' : 'check', 18)}<span>${esc(message)}</span>`;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 220);
    }, 2600);
  }

  window.WP_UI = { esc, icon, logo, badge, avatar, progress, sparkline, metricCard, emptyState, field, input, select, button, pageHeader, tabs, statLine, toast, status };
})();
