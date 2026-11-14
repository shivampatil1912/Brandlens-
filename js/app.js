/* BrandLens shared UI: icons, app shell (sidebar/topbar/bell), toasts, modal, finding cards, helpers. */
(function (root) {
  'use strict';
  const BASE = document.documentElement.dataset.base || '';

  const ICONS = {
    'layout-dashboard': '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4"/><path d="M21 5h-4"/>',
    menu: '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    'bar-chart': '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>'
  };
  const icon = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const q = name => new URLSearchParams(location.search).get(name);
  const fmtDate = iso => iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '–';
  const initials = n => String(n || '?').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const STATUS = { draft: ['Draft', 'muted'], ai_checked: ['AI checked', 'info'], pending_review: ['Pending review', 'warn'], approved: ['Approved', 'ok'], changes_requested: ['Changes requested', 'warn'], rejected: ['Rejected', 'bad'] };
  const badge = s => { const [l, c] = STATUS[s] || [s, 'muted']; return `<span class="badge b-${c}">${l}</span>`; };
  const statusLabel = s => (STATUS[s] || [s])[0];

  /* ---------- toast & modal ---------- */
  function toast(msg, type) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), type === 'bad' ? 6000 : 3800);
  }
  function confirmBox({ title, message, confirmText = 'Confirm', danger = false }) {
    return new Promise(res => {
      const el = document.createElement('div'); el.className = 'backdrop';
      el.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>${esc(title)}</h2><p>${esc(message)}</p><div class="row"><button class="btn" data-r="0">Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-r="1">${esc(confirmText)}</button></div></div>`;
      const done = v => { el.remove(); document.removeEventListener('keydown', key); res(v); };
      const key = e => { if (e.key === 'Escape') done(false); };
      el.addEventListener('click', e => { if (e.target === el) done(false); const b = e.target.closest('[data-r]'); if (b) done(b.dataset.r === '1'); });
      document.addEventListener('keydown', key); document.body.appendChild(el); el.querySelector('[data-r="1"]').focus();
    });
  }

  /* ---------- small renderers ---------- */
  const loading = (t = 'Loading…') => `<div class="loading"><span class="spinner"></span><p style="margin-top:10px">${esc(t)}</p></div>`;
  const empty = (ic, title, text, action = '') => `<div class="empty"><div class="ic-wrap">${icon(ic, 22)}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`;
  const banner = (type, title, text, ic) => `<div class="banner ${type}">${icon(ic || (type === 'ok' ? 'check-circle' : 'alert'), 20)}<div><strong>${esc(title)}</strong>${text ? esc(text) : ''}</div></div>`;

  const CAT = { terminology: 'Terminology', claim: 'Claim', fact: 'Facts & figures', disclaimer: 'Disclaimer', tone: 'Tone', improvement: 'Writing', grammar: 'Grammar', vision: 'Visual & Accessibility' };
  const FSTAT = { confirmed_mismatch: ['Confirmed mismatch', 'bad'], potential_issue: ['Potential issue', 'info'], needs_verification: ['Needs verification', 'warn'], suggestion: ['Optional suggestion', 'muted'] };
  const SEV = { critical: 'Critical', high: 'High', medium: 'Medium', info: 'Informational', low: 'Informational' };
  const sevKey = f => (f.severity === 'low' ? 'info' : f.severity);
  const GROUPS = [['violation', 'Rule violations', 'alert'], ['unsupported', 'Unsupported claims', 'search'], ['tone', 'Brand tone mismatch', 'pencil'], ['improvement', 'Improvement suggestions', 'sparkles']];
  const groupOf = f => f.group || BrandCheck.GROUP[f.category];

  function highlight(text, findings) {
    const items = (findings || []).filter(f => f.start >= 0 && f.decision !== 'dismissed').sort((a, b) => a.start - b.start);
    let out = '', pos = 0;
    for (const f of items) {
      if (f.start < pos) continue;
      out += esc(text.slice(pos, f.start)) + `<mark class="hl hl-${sevKey(f)}" data-fid="${f.id}" tabindex="0" title="${esc(FSTAT[f.status] ? FSTAT[f.status][0] : '')}">${esc(text.slice(f.start, f.end))}</mark>`;
      pos = f.end;
    }
    return out + esc(text.slice(pos));
  }
  function findingCard(f, { actions = false, reviewActions = false } = {}) {
    const [sl, sc] = FSTAT[f.status] || [f.status, 'muted'];
    const dismissed = f.decision === 'dismissed', falseAlarm = f.decision === 'false_alarm';
    const muted = dismissed || falseAlarm;
    const excerptHtml = f.excerpt && f.start >= 0 ? `<blockquote class="excerpt">${esc(f.excerpt)}</blockquote>`
      : f.category === 'vision' && f.excerpt ? `<blockquote class="excerpt">${esc(f.excerpt)}</blockquote>`
      : '<blockquote class="excerpt missing">Not in the post yet</blockquote>';
    return `<article class="finding sev-${sevKey(f)}${muted ? ' is-dismissed' : ''}" id="fc-${f.id}" data-fid="${f.id}">
      <div class="finding-top"><span class="sev sev-${sevKey(f)}">${SEV[f.severity]} severity</span><span class="cat">${CAT[f.category] || f.category}</span><span class="badge b-${sc}">${sl}</span>${dismissed ? '<span class="badge b-muted">Dismissed</span>' : ''}${falseAlarm ? '<span class="badge b-warn">False alarm</span>' : ''}</div>
      ${excerptHtml}
      <p class="why">${esc(f.reason)}</p>
      <dl class="meta"><dt>Related rule</dt><dd>${esc(f.rule)}</dd><dt>Evidence</dt><dd>${esc(f.evidence)}</dd></dl>
      <div class="suggest">${icon('sparkles', 16)}<div><strong>Suggestion</strong><br>${esc(f.suggestion)}${f.fix && f.fix.type === 'append' ? `<div class="addition">${esc(f.fix.text)}</div>` : ''}</div></div>
      ${actions && !muted ? `<div class="finding-actions">${f.fix ? '<button class="btn btn-primary btn-sm" data-act="accept">Accept suggestion</button>' : ''}${f.category !== 'vision' ? '<button class="btn btn-sm" data-act="edit">Edit manually</button>' : ''}<button class="btn btn-ghost btn-sm" data-act="dismiss">Dismiss</button></div>` : ''}
      ${reviewActions && !muted ? `<div class="finding-actions"><button class="btn btn-ghost btn-sm" data-act="false_alarm">${icon('flag', 14)}Mark false alarm</button></div>` : ''}
    </article>`;
  }
  /* findings grouped by the four categories */
  function groupedFindings(f, opts) {
    const out = GROUPS.map(([k, label, ic]) => { const items = f.filter(x => groupOf(x) === k); return items.length ? `<h3 class="group-title">${icon(ic, 17)}${label} (${items.length})</h3><div class="stack">${items.map(x => findingCard(x, opts)).join('')}</div>` : ''; }).join('');
    return out;
  }

  function scoreDeltaCard(versions) {
    if (!Array.isArray(versions) || versions.length < 2) return '';
    const checked = versions.filter(v => Array.isArray(v.findings));
    if (checked.length < 2) return '';
    const v1 = checked[0], v2 = checked[checked.length - 1];
    if (v1.no === v2.no) return '';
    const s1 = BrandCheck.score(v1.findings).value, s2 = BrandCheck.score(v2.findings).value;
    const diff = s2 - s1;
    const cls = diff > 0 ? 'b-ok' : diff < 0 ? 'b-warn' : 'b-muted';
    const lbl = diff > 0 ? `+${diff} pts improved` : diff < 0 ? `${diff} pts` : 'Unchanged';
    return `<section class="card card-pad" style="margin-bottom:14px;background:#F8FAFC">
      <div class="row between" style="gap:10px;flex-wrap:wrap">
        <div><b style="font-size:.9rem">Before vs After Score</b><div class="muted small">Initial v${v1.no}: <b>${s1}/100</b> &rarr; Latest v${v2.no}: <b>${s2}/100</b></div></div>
        <span class="badge ${cls}">${lbl}</span>
      </div>
    </section>`;
  }

  function scoreCard(findings) {
    const sc = BrandCheck.score(findings), col = sc.value >= 90 ? '#14703A' : sc.value >= 70 ? '#A8650A' : '#B91C1C';
    return `<div class="score"><div class="ring" style="--v:${sc.value};--c:${col}"><span>${sc.value}</span></div><div><b>${sc.label}</b>
      <ul>${sc.rows.length ? sc.rows.map(r => `<li>${r.count} ${SEV[r.severity].toLowerCase()} × −${r.each} = −${r.points}</li>`).join('') : '<li>No open findings</li>'}</ul></div></div>
      <p class="muted small" style="margin-top:10px">Score = 100 minus a fixed amount per open finding (critical 25, high 15, medium 8, informational 2). Dismissed findings do not count. It measures rule matches only, not legal or factual correctness.</p>`;
  }
  const sevBadge = s => `<span class="sev-b sevb-${s === 'low' ? 'info' : s}">${SEV[s] || s}</span>`;
  /* word-level diff: returns HTML with <ins>/<del> */
  function diffHtml(a, b) {
    const A = String(a).split(/(\s+)/).filter(x => x !== ''), B = String(b).split(/(\s+)/).filter(x => x !== '');
    const n = A.length, m = B.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0, out = '', ins = '', del = '';
    const flush = () => { if (del) out += `<del class="d">${esc(del)}</del>`; if (ins) out += `<ins class="d">${esc(ins)}</ins>`; del = ins = ''; };
    while (i < n || j < m) {
      if (i < n && j < m && A[i] === B[j]) { flush(); out += esc(A[i]); i++; j++; }
      else if (j < m && (i === n || L[i][j + 1] >= L[i + 1][j])) { ins += B[j++]; }
      else { del += A[i++]; }
    }
    flush(); return out;
  }
  const timeline = ev => `<ol class="timeline">${ev.slice().reverse().map(e => `<li>${esc(e.text)}<small>${e.by ? esc(e.by) + ' · ' : ''}${fmtDate(e.at)}</small></li>`).join('')}</ol>`;
  const comments = list => list.length ? list.map(c => `<div class="comment ${c.role}"><b>${esc(c.by)}</b><small>${fmtDate(c.at)}</small><p>${esc(c.text)}</p></div>`).join('') : '<p class="muted small">No comments yet.</p>';
  function flash(sel) { const el = document.querySelector(sel); if (!el) return; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1400); }

  /* ---------- shell ---------- */
  const NAV = {
    company: [['dashboard', 'Dashboard', 'layout-dashboard'], ['knowledge', 'Brand Knowledge', 'book-open'], ['requests', 'Review Requests', 'inbox'], ['insights', 'Insights', 'bar-chart'], ['history', 'Activity History', 'history'], ['settings', 'Settings', 'sliders']],
    creator: [['dashboard', 'Dashboard', 'layout-dashboard'], ['companies', 'Find Companies', 'building'], ['studio', 'New Content', 'pencil'], ['submissions', 'My Submissions', 'file-text']]
  };

  function shell({ role, active, title }) {
    const s = API.session();
    if (!s || s.user.role !== role) { location.replace(`${BASE}auth.html?role=${role}`); return null; }
    document.title = `${title} · BrandLens`;
    const sub = role === 'company' ? s.company.name : 'Creator workspace';
    document.getElementById('app').innerHTML = `
      <div class="app">
        <aside class="sidebar" id="sidebar">
          <a class="brand" href="${BASE}index.html"><img src="${BASE}assets/logo-mark.png" alt="">BrandLens</a>
          <div class="ws"><span style="opacity:.7">${role === 'company' ? 'Company workspace' : 'Signed in as creator'}</span><b>${esc(role === 'company' ? s.company.name : s.user.name)}</b></div>
          <nav class="nav" aria-label="Main">${NAV[role].map(([k, l, i]) => `<a href="${k}.html" class="${k === active ? 'on' : ''}">${icon(i)}<span data-i18n="nav_${k}">${l}</span></a>`).join('')}</nav>
          <div class="side-foot"><button id="logout">${icon('log-out')}<span data-i18n="logout">Log out</span></button></div>
        </aside>
        <div class="main">
          <header class="topbar">
            <button class="btn btn-ghost burger" id="burger" aria-label="Open menu" style="padding:6px;place-items:center">${icon('menu', 22)}</button>
            <span class="t">${esc(title)}</span><span class="grow"></span>
            ${['novatech12@gmail.com', 'admin@novatech.test', 'shivampatil123@gmail.com', 'creator@test.dev'].includes((s.user.email || '').toLowerCase()) ? `<button type="button" class="btn btn-sm" id="switchDemoBtn" style="border:1px dashed #6366f1;color:#4f46e5;background:#EEF2FF;font-weight:600" data-i18n="${role === 'company' ? 'switch_to_creator' : 'switch_to_company'}">${role === 'company' ? 'Switch to Creator' : 'Switch to Company'}</button>` : ''}
            ${root.BrandI18n ? root.BrandI18n.switcherHtml() : ''}
            <div class="bell"><button class="bell-btn" id="bellBtn" aria-label="Notifications">${icon('bell')}<span class="dot hide" id="bellDot">0</span></button>
              <div class="bell-panel" id="bellPanel"><header><span>Notifications</span><button class="btn btn-ghost btn-sm" id="markRead">Mark all read</button></header><div class="bell-list" id="bellList"></div></div></div>
            <div class="me"><div class="who"><b>${esc(s.user.name)}</b><span class="muted">${esc(s.user.email)}</span></div><div class="avatar">${esc(initials(s.user.name))}</div></div>
          </header>
          <main class="content" id="content"></main>
        </div>
      </div><div class="toasts" id="toasts"></div>`;
    window.addEventListener('pageshow', e => { if (e.persisted && !API.session()) location.reload(); }); // block stale pages after logout via Back button
    document.getElementById('logout').onclick = async () => { await API.logout(); location.href = `${BASE}index.html`; };
    const swBtn = document.getElementById('switchDemoBtn');
    if (swBtn) {
      swBtn.onclick = async () => {
        const targetRole = role === 'company' ? 'creator' : 'company';
        const targetEmail = targetRole === 'company' ? 'novatech12@gmail.com' : 'shivampatil123@gmail.com';
        try { await API.login({ email: targetEmail, password: '12345678', role: targetRole, remember: true }); location.href = `${BASE}${targetRole}/dashboard.html`; }
        catch (err) { toast(err.message, 'bad'); }
      };
    }
    if (root.BrandI18n) root.BrandI18n.apply();
    document.getElementById('burger').onclick = () => document.body.classList.toggle('nav-open');
    document.getElementById('content').addEventListener('click', () => document.body.classList.remove('nav-open'));
    const panel = document.getElementById('bellPanel');
    document.getElementById('bellBtn').onclick = e => { e.stopPropagation(); panel.classList.toggle('open'); };
    document.addEventListener('click', e => { if (!panel.contains(e.target)) panel.classList.remove('open'); });
    document.getElementById('markRead').onclick = async () => { await API.markAllRead(); refreshBell(); };
    async function refreshBell() {
      const list = await API.notifications(), unread = list.filter(n => !n.read).length, dot = document.getElementById('bellDot');
      if (!dot) return;
      dot.textContent = unread > 9 ? '9+' : unread; dot.classList.toggle('hide', !unread);
      document.getElementById('bellList').innerHTML = list.length ? list.slice(0, 12).map(n => `<a class="n ${n.read ? '' : 'unread'}" href="${n.link}">${esc(n.text)}<small>${fmtDate(n.at)}</small></a>`).join('') : '<div class="empty" style="padding:28px 16px">Nothing new yet.</div>';
    }
    refreshBell(); window.addEventListener('storage', refreshBell); window.addEventListener('focus', refreshBell); if (root.BrandTrust) root.BrandTrust.onSync(() => refreshBell());
    return { content: document.getElementById('content'), user: s.user, company: s.company, refreshBell };
  }

  root.UI = { groupedFindings, scoreCard, scoreDeltaCard, sevBadge, diffHtml, GROUPS, SEV, icon, esc, q, fmtDate, badge, statusLabel, toast, confirmBox, loading, empty, banner, highlight, findingCard, timeline, comments, flash, shell, STATUS, CAT, FSTAT, initials, BASE };
})(window);
