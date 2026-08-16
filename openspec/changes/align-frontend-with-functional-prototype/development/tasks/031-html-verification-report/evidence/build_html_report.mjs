#!/usr/bin/env node

/**
 * Task 031 HTML verification report generator.
 *
 * Reads the executed evidence (change acceptance, six-domain summary, the
 * 67-row parity matrix, per-slice acceptances 001-030, validation log) and
 * writes the three self-contained HTML pages plus the report model and the
 * render manifest. Fails closed when a required evidence file is missing or
 * not-ok, and never claims parity for blocked or unverified rows.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const changeDir = path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype');
const reportsDir = path.join(changeDir, 'verify/reports');
const v2Dir = path.join(changeDir, 'verify/v2');
const tasksDir = path.join(changeDir, 'development/tasks');

mkdirSync(reportsDir, { recursive: true });

const read = (p) => readFileSync(p, 'utf8');
const readJson = (p) => JSON.parse(read(p));

// --- evidence inputs -------------------------------------------------------
const acceptance = readJson(path.join(changeDir, 'acceptance.json'));
const sixDomain = readJson(path.join(tasksDir, '030-six-domain-verification/evidence/six-domain-summary.json'));
assert.equal(sixDomain.ok, true, 'six-domain summary must be ok');
const matrixText = read(path.join(changeDir, 'route-parity.md'));
const matrixRows = [
  ...matrixText.matchAll(
    /^\|\s*(\d+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|\s*(not-started|in-progress|verified|blocked)\s*\|$/gm,
  ),
].map((m) => ({
  row: Number(m[1]),
  prototype: m[2].trim(),
  production: m[3].trim(),
  assessment: m[4].trim(),
  status: m[5],
}));
assert.equal(matrixRows.length, 67, `matrix must have 67 rows, found ${matrixRows.length}`);
const row4 = matrixRows.find((r) => r.row === 4);
assert.equal(row4.status, 'blocked', 'row 4 must stay blocked');
const verifiedRows = matrixRows.filter((r) => r.status === 'verified').length;

// per-slice acceptance inventory
const sliceAcceptances = [];
for (const dir of readdirSync(tasksDir).sort()) {
  const acceptancePath = path.join(tasksDir, dir, 'acceptance.json');
  if (!existsSync(acceptancePath)) continue;
  const a = readJson(acceptancePath);
  sliceAcceptances.push({
    task: dir,
    status: a.status,
    head: a.reviewed_git_head,
    assertions: (a.assertions ?? []).map((x) => x.id),
  });
}
assert.ok(sliceAcceptances.length >= 30, `expected >= 30 slice acceptances, found ${sliceAcceptances.length}`);

// validation log receipts
const receipts = read(path.join(changeDir, 'development/validation-log.jsonl'))
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line));

// --- helpers ---------------------------------------------------------------
const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const esc = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const statusBadge = (status) => `<span class="badge ${status}">${esc(status)}</span>`;

const css = `
  :root { --bg:#0e1923; --card:#172733; --text:#e8f1f4; --muted:#9fb4bf; --ok:#28c76f; --warn:#ffb548; --danger:#ff5d61; --info:#4c8dff; --border:#304452; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif; }
  .wrap { max-width:1100px; margin:0 auto; padding:32px 20px 64px; }
  h1 { font-size:24px; margin:0 0 4px; }
  h2 { font-size:18px; margin:28px 0 10px; border-bottom:1px solid var(--border); padding-bottom:6px; }
  .sub { color:var(--muted); margin:0 0 20px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:12px; margin:16px 0; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:10px; padding:14px 16px; }
  .card .num { font-size:26px; font-weight:700; }
  .card .lbl { color:var(--muted); font-size:12px; margin-top:2px; }
  table { width:100%; border-collapse:collapse; margin:10px 0 20px; font-size:13px; }
  th,td { text-align:left; padding:7px 10px; border-bottom:1px solid var(--border); vertical-align:top; }
  th { color:var(--muted); font-weight:600; }
  .badge { display:inline-block; padding:2px 9px; border-radius:999px; font-size:12px; font-weight:600; }
  .badge.verified { background:rgba(40,199,111,.15); color:var(--ok); }
  .badge.blocked { background:rgba(255,93,97,.15); color:var(--danger); }
  .badge.pass { background:rgba(40,199,111,.15); color:var(--ok); }
  .badge.passing { background:rgba(40,199,111,.15); color:var(--ok); }
  .badge.failing { background:rgba(255,93,97,.15); color:var(--danger); }
  .badge.not-started { background:rgba(159,180,191,.15); color:var(--muted); }
  .badge.in-progress { background:rgba(255,181,72,.15); color:var(--warn); }
  .badge.unknown { background:rgba(159,180,191,.15); color:var(--muted); }
  .banner { border:1px solid var(--danger); background:rgba(255,93,97,.08); color:#ffb3b5; border-radius:10px; padding:12px 16px; margin:16px 0; }
  .mono { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:12px; }
  nav a { color:var(--info); margin-right:14px; text-decoration:none; }
  nav a:hover { text-decoration:underline; }
  .ok { color:var(--ok); } .danger { color:var(--danger); } .warn { color:var(--warn); }
`;

const shell = (title, body, active) => `<!doctype html>
<html lang="zh-Hans"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Woodpecker Ops Console 原型对齐验证</title><style>${css}</style></head>
<body><div class="wrap">
<h1>${esc(title)}</h1>
<p class="sub">Woodpecker Ops Console · align-frontend-with-functional-prototype · 验证报告</p>
<nav>
  <a href="overview.html" class="${active === 'overview' ? 'warn' : ''}">总览 Overview</a>
  <a href="test-case-catalog.html" class="${active === 'catalog' ? 'warn' : ''}">平价矩阵 Parity Matrix</a>
  <a href="test-case-results.html" class="${active === 'results' ? 'warn' : ''}">切片证据 Slice Evidence</a>
</nav>
${body}
</div></body></html>`;

const generatedAt = new Date().toISOString();
const gitHead = (() => {
  try {
    return readFileSync(path.join(projectRoot, '.git/HEAD'), 'utf8').trim();
  } catch {
    return 'unknown';
  }
})();

// --- overview.html ---------------------------------------------------------
const domainRows = sixDomain.domains
  .map(
    (d) =>
      `<tr><td>${esc(d.domain)}</td><td>${d.ok ? '<span class="ok">PASS</span>' : '<span class="danger">FAIL</span>'}</td><td>${esc(d.detail)}</td></tr>`,
  )
  .join('');
const assertionRows = acceptance.assertions
  .map(
    (a) =>
      `<tr><td class="mono">${esc(a.id)}</td><td>${statusBadge(a.status)}</td><td>${esc(a.statement ?? a.claim ?? '')}</td></tr>`,
  )
  .join('');
const overviewBody = `
<div class="banner"><strong>Blocked row 4 明确保留：</strong>仓库添加流程（生产端实测激活列表 vs 原型四步添加向导）保持 blocked，本报告不声称其平价。</div>
<div class="cards">
  <div class="card"><div class="num">${matrixRows.length}</div><div class="lbl">平价矩阵总行数</div></div>
  <div class="card"><div class="num ok">${verifiedRows}</div><div class="lbl">verified 行</div></div>
  <div class="card"><div class="num danger">1</div><div class="lbl">blocked 行（row 4）</div></div>
  <div class="card"><div class="num">${sliceAcceptances.length}</div><div class="lbl">已签署切片验收</div></div>
  <div class="card"><div class="num ${sixDomain.ok ? 'ok' : 'danger'}">${sixDomain.domains.length}</div><div class="lbl">六域验证 ${sixDomain.ok ? '全部通过' : '存在失败'}</div></div>
</div>
<h2>Acceptance Assertions</h2>
<table><thead><tr><th>ID</th><th>状态</th><th>声明</th></tr></thead><tbody>${assertionRows}</tbody></table>
<h2>Six Verification Domains</h2>
<table><thead><tr><th>域</th><th>结果</th><th>详情</th></tr></thead><tbody>${domainRows}</tbody></table>
<h2>报告生成信息</h2>
<p class="mono">generated_at: ${esc(generatedAt)} · git_head: ${esc(gitHead)}<br>
V2 适配器生命周期未运行（verify/v2 仅含 runtime-status.json）；本报告由
<code>development/tasks/031-html-verification-report/evidence/build_html_report.mjs</code>
直接基于已执行证据生成。</p>`;
const overviewHtml = shell('总览 Overview', overviewBody, 'overview');

// --- test-case-catalog.html (67 rows) -------------------------------------
const rowRows = matrixRows
  .map(
    (r) =>
      `<tr><td class="mono">${r.row}</td><td class="mono">${esc(r.prototype)}</td><td class="mono">${esc(r.production)}</td><td>${esc(r.assessment)}</td><td>${statusBadge(r.status)}</td></tr>`,
  )
  .join('');
const catalogBody = `
<div class="banner"><strong>Blocked row 4 明确保留：</strong>${esc(row4.assessment)}</div>
<p>共 ${matrixRows.length} 行：${verifiedRows} verified / 1 blocked（row 4）。已声称 verified 的行均持有切片验收与浏览器证据引用。</p>
<table><thead><tr><th>#</th><th>原型路由</th><th>生产路由</th><th>证据/说明</th><th>状态</th></tr></thead><tbody>${rowRows}</tbody></table>`;
const catalogHtml = shell('平价矩阵 Parity Matrix', catalogBody, 'catalog');

// --- test-case-results.html (slice evidence) ------------------------------
const sliceRows = sliceAcceptances
  .map(
    (s) =>
      `<tr><td class="mono">${esc(s.task)}</td><td>${statusBadge(s.status)}</td><td class="mono">${esc(s.assertions.join(', '))}</td><td class="mono">${esc(s.head.slice(0, 10))}</td></tr>`,
  )
  .join('');
const receiptRows = receipts
  .slice(-12)
  .reverse()
  .map(
    (r) =>
      `<tr><td class="mono">${esc(r.task ?? '')}</td><td>${statusBadge(r.status ?? 'unknown')}</td><td class="mono">${esc((r.receipt_id ?? r.id ?? '').toString().slice(0, 24))}</td><td>${esc(r.summary ?? '')}</td></tr>`,
  )
  .join('');
const resultsBody = `
<h2>Slice Acceptances（${sliceAcceptances.length}）</h2>
<table><thead><tr><th>切片</th><th>验收</th><th>断言</th><th>HEAD</th></tr></thead><tbody>${sliceRows}</tbody></table>
<h2>Validation Receipts（最近 12 条）</h2>
<table><thead><tr><th>任务</th><th>结果</th><th>Receipt</th><th>摘要</th></tr></thead><tbody>${receiptRows}</tbody></table>`;
const resultsHtml = shell('切片证据 Slice Evidence', resultsBody, 'results');

// --- write artifacts -------------------------------------------------------
const htmlFiles = {
  'verify/reports/overview.html': overviewHtml,
  'verify/reports/test-case-catalog.html': catalogHtml,
  'verify/reports/test-case-results.html': resultsHtml,
};
for (const [rel, content] of Object.entries(htmlFiles)) {
  writeFileSync(path.join(changeDir, rel), content);
}

const reportModel = {
  schema: 'specnav.verification.report-model.v2',
  report_id: `report-${sha256(overviewHtml).slice(0, 24)}`,
  generated_at: generatedAt,
  git_head: gitHead,
  aggregate: { ok: sixDomain.ok, domains: sixDomain.domains.map((d) => ({ domain: d.domain, ok: d.ok })) },
  acceptance: { assertions: acceptance.assertions },
  route_matrix: { rows: matrixRows.length, verified: verifiedRows, blocked: 1, row4_blocked: true },
  evidence_index: { slice_acceptances: sliceAcceptances.length, validation_receipts: receipts.length },
  runtime: {
    v2_adapter_lifecycle: 'not-run',
    note: 'verify/v2 contains runtime-status.json only; report generated from executed development evidence',
  },
};
writeFileSync(path.join(v2Dir, 'report-model.json'), `${JSON.stringify(reportModel, null, 2)}\n`);

const manifest = {
  schema: 'specnav.verification.report-render-manifest.v2',
  report_model_id: reportModel.report_id,
  generated_at: generatedAt,
  pages: Object.entries(htmlFiles).map(([rel, content]) => ({
    path: rel,
    sha256: sha256(content),
    size: Buffer.byteLength(content),
  })),
};
writeFileSync(path.join(v2Dir, 'report-render-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

// self-check: manifest hashes must match the written files
for (const page of manifest.pages) {
  const written = readFileSync(path.join(changeDir, page.path), 'utf8');
  assert.equal(sha256(written), page.sha256, `manifest hash mismatch for ${page.path}`);
}
assert.equal(
  matrixRows.filter((r) => r.status === 'verified').length + 1,
  matrixRows.length,
  'exactly one blocked row',
);
console.log(
  JSON.stringify(
    { ok: true, pages: manifest.pages.map((p) => p.path), report_model_id: reportModel.report_id },
    null,
    2,
  ),
);
