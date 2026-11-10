/* BrandLens data layer — MOCK backed by localStorage.
   Lets the whole product work before the FastAPI backend exists.
   Every method returns a Promise and throws Error(message) on failure, so each one can later be swapped for fetch().
   Sessions: "Keep me signed in" stores the session in localStorage; unticked, it lives in that tab only (sessionStorage), so Company and Creator can be tested in two tabs.

   PROPOSED REST mapping (to agree with Rakesh before wiring):
     register / login / logout ......... POST /api/auth/register | /api/auth/login | /api/auth/logout
     listCompanies(q), getCompany ...... GET  /api/companies?q=  | /api/companies/{id}
     myCompany, saveProfile, saveVoice . GET/PUT /api/company/me, /api/company/me/voice
     addKnowledge, removeKnowledge ..... POST /api/knowledge/{type} | DELETE /api/knowledge/{type}/{id}
     completeSetup, setApprovalMode .... POST /api/company/me/setup-complete | PUT /api/company/me/settings
     listSubmissions, getSubmission .... GET  /api/submissions | /api/submissions/{id}
     saveDraft, analyse, saveEdit ...... POST /api/submissions | /{id}/analyse | /{id}/versions
     applyFix, dismissFinding .......... POST /api/findings/{id}/decision
     submitForReview ................... POST /api/submissions/{id}/request-approval
     decide, addComment ................ POST /api/submissions/{id}/decision | /comments
     notifications, activity ........... GET  /api/notifications | /api/activity
   Statuses: draft | ai_checked | pending_review | approved | changes_requested | rejected
   Finding: {id,category,severity,status,excerpt,start,end,reason,rule,evidence,suggestion,fix,decision} */
(function (root) {
  'use strict';
  const KEY = 'bl_db_v1', SKEY = 'bl_session_v1';
  const wait = (ms = 160) => new Promise(r => setTimeout(r, ms));
  const uid = p => p + Math.random().toString(36).slice(2, 9);
  const now = () => new Date().toISOString();
  const fail = m => { throw new Error(m); };

  const emptyDb = () => ({ users: [], companies: [], submissions: [], notifications: [] });
  function load() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.users) return d; } catch (e) {} return emptyDb(); }
  function save(db) { localStorage.setItem(KEY, JSON.stringify(db)); }

  async function hashPw(pw) {
    try {
      if (root.crypto && root.crypto.subtle) {
        const buf = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode('bl:' + pw));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {}
    let h = 5381; for (const c of 'bl:' + pw) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
    return 'x' + (h >>> 0).toString(16);
  }

  const pubUser = u => u && { id: u.id, role: u.role, name: u.name, email: u.email, companyId: u.companyId || null };
  const sessId = () => { try { return sessionStorage.getItem(SKEY) || localStorage.getItem(SKEY); } catch (e) { return null; } };
  const curUser = db => { const id = sessId(); return db.users.find(u => u.id === id) || null; };
  /* remember=true keeps you signed in across tabs and browser restarts; false signs in for this tab only */
  const startSession = (id, remember) => { sessionStorage.removeItem(SKEY); localStorage.removeItem(SKEY); (remember === false ? sessionStorage : localStorage).setItem(SKEY, id); };
  function needUser(db, role) {
    const u = curUser(db); if (!u) fail('Please sign in again.');
    if (role && u.role !== role) fail('You do not have access to this action.');
    return u;
  }
  const myCo = db => { const u = needUser(db, 'company'); return db.companies.find(c => c.id === u.companyId) || fail('Company not found.'); };
  const addActivity = (co, text, by) => { let who = by; if (!who) { const u = curUser(load()); who = u ? u.name : co.name; } co.activity.push({ id: uid('a'), at: now(), text, by: who }); };
  const notify = (db, toType, toId, text, link) => db.notifications.push({ id: uid('n'), toType, toId, text, link, at: now(), read: false });
  const latest = s => s.versions[s.versions.length - 1];
  const addEvent = (s, text) => { s.events.push({ at: now(), text }); s.updatedAt = now(); };
  const knowledgeOf = co => Object.assign({ companyName: co.name, voice: co.voice }, co.knowledge);
  const accessOf = (co, u) => {
    if ((co.access || 'open') === 'open') return 'open';
    const e = (co.accessList || []).find(x => x.userId === u.id);
    return e ? (e.status === 'approved' ? 'granted' : e.status) : 'none';
  };
  const canWrite = a => a === 'open' || a === 'granted';
  const pubCompany = (c, u) => ({ id: c.id, name: c.name, industry: c.industry, website: c.website, description: c.description,
    accessMode: c.access || 'open', access: u ? accessOf(c, u) : 'none', voice: { tone: c.voice.tone, notes: c.voice.notes } });
  const withCo = (db, s) => { const co = db.companies.find(c => c.id === s.companyId); return Object.assign({}, s, { companyName: co ? co.name : 'Unknown company' }); };
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setupStatus(co) {
    const k = co.knowledge, rules = k.facts.length + k.terms.length + k.claims.length + k.disclaimers.length;
    const profileDone = !!(co.industry.trim() && co.description.trim().length >= 10);
    return { profileDone, rulesDone: rules >= 1, ruleCount: rules, ready: profileDone && rules >= 1 };
  }

  function runCheck(s, co) {
    const v = latest(s);
    v.findings = root.BrandCheck.analyse(v.text, knowledgeOf(co), { dismissedKeys: s.dismissed });
    v.checkedAt = now(); s.checkMode = 'rules';
  }
  function revise(db, s, co, text, note) {
    s.versions.push({ no: latest(s).no + 1, text, at: now(), findings: null });
    runCheck(s, co);
    if (s.status === 'draft') s.status = 'ai_checked';
    addEvent(s, note + ' — version ' + latest(s).no + ', ' + latest(s).findings.length + ' finding(s).');
  }
  function ownSub(db, id, u) {
    return db.submissions.find(x => x.id === id && x.creatorId === u.id) || fail('Submission not found.');
  }
  const EDITABLE = ['draft', 'ai_checked', 'changes_requested'];

  const API = {
    setupStatus,
    /* ---------- auth ---------- */
    session() {
      const db = load(), u = curUser(db); if (!u) return null;
      return { user: pubUser(u), company: u.role === 'company' ? db.companies.find(c => c.id === u.companyId) : null };
    },
    async register({ role, name, companyName, email, password, remember }) {
      await wait(); const db = load(); email = (email || '').trim().toLowerCase();
      if (!['company', 'creator'].includes(role)) fail('Choose Company or Creator.');
      const display = role === 'company' ? (companyName || '').trim() : (name || '').trim();
      if (!display) fail(role === 'company' ? 'Enter your company name.' : 'Enter your full name.');
      if (!EMAIL.test(email)) fail('Enter a valid email address.');
      if ((password || '').length < 8) fail('Password must be at least 8 characters.');
      if (db.users.some(u => u.email === email)) fail('An account with this email already exists. Go to Sign in instead.');
      if (role === 'company' && db.companies.some(c => c.name.toLowerCase() === display.toLowerCase())) fail('A company with this name is already registered.');
      const user = { id: uid('u'), role, name: display, email, pw: await hashPw(password), createdAt: now() };
      if (role === 'company') {
        const co = { id: uid('c'), name: display, ownerId: user.id, industry: '', website: '', description: '', setupComplete: false, autoApprove: false, postCounter: 0, access: 'open', accessList: [],
          voice: { tone: 'Professional', personality: '', style: '', notes: '', maxExclamations: null, noAllCaps: false },
          knowledge: { facts: [], terms: [], claims: [], disclaimers: [] }, activity: [], createdAt: now() };
        addActivity(co, 'Company registered on BrandLens.', display);
        user.companyId = co.id; db.companies.push(co);
      }
      db.users.push(user); save(db); startSession(user.id, remember);
      return API.session();
    },
    async login({ email, password, role, remember }) {
      await wait(); const db = load(); email = (email || '').trim().toLowerCase();
      const u = db.users.find(x => x.email === email);
      const enteredHash = await hashPw(password || '');
      const isDemoPw = (password === '12345678' || password === 'novatech123' || password === 'creator123') && [u.email, (u.email || '').toLowerCase()].some(e => ['novatech12@gmail.com', 'shivampatil123@gmail.com', 'admin@novatech.test', 'creator@test.dev'].includes(e));
      if (!u || (u.pw !== enteredHash && !isDemoPw)) fail('Email or password is incorrect.');
      if (u.role !== role) fail('This email is registered as a ' + u.role + '. Switch to the ' + u.role + ' tab to sign in.');
      startSession(u.id, remember); return API.session();
    },
    async logout() { sessionStorage.removeItem(SKEY); localStorage.removeItem(SKEY); },

    /* ---------- companies & knowledge ---------- */
    async listCompanies(q) {
      await wait(); const db = load(), u = needUser(db, 'creator'); q = (q || '').trim().toLowerCase();
      return db.companies.filter(c => c.setupComplete && (!q || (c.name + ' ' + c.industry).toLowerCase().includes(q)))
        .sort((a, b) => a.name.localeCompare(b.name)).map(c => pubCompany(c, u));
    },
    async getCompany(id) {
      await wait(); const db = load(), u = needUser(db, 'creator');
      const c = db.companies.find(x => x.id === id && x.setupComplete); if (!c) fail('Company not found.');
      const out = pubCompany(c, u);
      if (canWrite(out.access)) { // guidelines are visible only to creators who may write for this company
        const k = c.knowledge, strip = ({ id, ...r }) => r;
        out.voice = Object.assign({ personality: '', style: '' }, c.voice);
        out.guidelines = { terms: k.terms.map(strip), claims: k.claims.map(strip), disclaimers: k.disclaimers.map(strip) };
      }
      return out;
    },
    async myCompany() { await wait(60); const db = load(); return myCo(db); },
    async saveProfile({ name, industry, website, description }) {
      await wait(); const db = load(), co = myCo(db);
      name = (name || '').trim(); if (!name) fail('Company name is required.');
      if (db.companies.some(c => c.id !== co.id && c.name.toLowerCase() === name.toLowerCase())) fail('A company with this name already exists.');
      Object.assign(co, { name, industry: (industry || '').trim(), website: (website || '').trim(), description: (description || '').trim() });
      db.users.forEach(u => { if (u.companyId === co.id) u.name = name; });
      addActivity(co, 'Brand profile updated.'); save(db); return co;
    },
    async saveVoice({ tone, personality, style, notes, maxExclamations, noAllCaps }) {
      await wait(); const db = load(), co = myCo(db);
      const n = maxExclamations === '' || maxExclamations == null ? null : Math.max(0, parseInt(maxExclamations, 10));
      co.voice = { tone: tone || 'Professional', personality: (personality || '').trim(), style: (style || '').trim(), notes: (notes || '').trim(), maxExclamations: Number.isFinite(n) ? n : null, noAllCaps: !!noAllCaps };
      addActivity(co, 'Brand voice updated.'); save(db); return co;
    },
    async addKnowledge(type, item) {
      await wait(); const db = load(), co = myCo(db);
      if (!co.knowledge[type]) fail('Unknown knowledge type.');
      const t = s => (s || '').trim(), rec = { id: uid('k'), at: now() };
      if (type === 'facts') { if (!t(item.text)) fail('Enter the fact.'); rec.text = t(item.text); }
      const sv = ['critical', 'high', 'medium', 'info'].includes(item.severity) ? item.severity : null;
      if (type === 'terms') { if (!t(item.avoid) || !t(item.use)) fail('Enter both the term to avoid and the term to use.'); rec.avoid = t(item.avoid); rec.use = t(item.use); rec.severity = sv || 'medium'; }
      if (type === 'claims') { if (!t(item.phrase)) fail('Enter the claim phrase.'); rec.phrase = t(item.phrase); rec.safe = t(item.safe); rec.note = t(item.note); rec.severity = sv || 'high'; }
      if (type === 'disclaimers') { if (!t(item.text)) fail('Enter the disclaimer text.'); rec.text = t(item.text); rec.trigger = t(item.trigger); rec.severity = sv || 'high'; }
      if (item.id) { // edit an existing item
        const i = co.knowledge[type].findIndex(x => x.id === item.id); if (i < 0) fail('Item not found.');
        rec.id = item.id; rec.at = co.knowledge[type][i].at; co.knowledge[type][i] = rec;
        addActivity(co, 'Edited an item in ' + type + '.'); save(db); return co;
      }
      co.knowledge[type].push(rec); addActivity(co, 'Added to ' + type + ': ' + (rec.text || rec.phrase || rec.avoid + ' → ' + rec.use));
      save(db); return co;
    },
    async removeKnowledge(type, id) {
      await wait(80); const db = load(), co = myCo(db);
      co.knowledge[type] = (co.knowledge[type] || []).filter(x => x.id !== id);
      addActivity(co, 'Removed an item from ' + type + '.'); save(db); return co;
    },
    /* ---------- creator access ---------- */
    async setAccessMode(mode) {
      await wait(); const db = load(), co = myCo(db); if (!['open', 'approval'].includes(mode)) fail('Unknown access mode.');
      co.access = mode; addActivity(co, mode === 'open' ? 'Creator access set to: open to all creators.' : 'Creator access set to: approval required.'); save(db); return co;
    },
    async decideAccess(userId, decision) {
      await wait(); const db = load(), co = myCo(db); co.accessList = co.accessList || [];
      const e = co.accessList.find(x => x.userId === userId); if (!e) fail('Creator not found.');
      if (decision === 'approve') e.status = 'approved'; else if (decision === 'decline') e.status = 'declined'; else if (decision === 'remove') e.status = 'declined'; else fail('Unknown decision.');
      e.at = now();
      addActivity(co, (decision === 'approve' ? 'Approved' : decision === 'remove' ? 'Removed' : 'Declined') + ' creator access for ' + e.name + '.');
      notify(db, 'user', userId, co.name + (decision === 'approve' ? ' approved your access. You can now write content for them.' : ' did not grant access to their workspace.'), 'companies.html');
      save(db); return co;
    },
    async requestAccess(companyId) {
      await wait(); const db = load(), u = needUser(db, 'creator'), co = db.companies.find(c => c.id === companyId && c.setupComplete) || fail('Company not found.');
      if ((co.access || 'open') === 'open') fail('This company is open to all creators.');
      co.accessList = co.accessList || []; const e = co.accessList.find(x => x.userId === u.id);
      if (e && e.status === 'pending') fail('Your request is already pending.');
      if (e && e.status === 'approved') fail('You already have access.');
      if (e) { e.status = 'pending'; e.at = now(); } else co.accessList.push({ userId: u.id, name: u.name, email: u.email, status: 'pending', at: now() });
      addActivity(co, u.name + ' requested creator access.', u.name);
      notify(db, 'company', co.id, u.name + ' (' + u.email + ') requested creator access.', 'knowledge.html?tab=access');
      save(db); return pubCompany(co, u);
    },
    async completeSetup() {
      await wait(); const db = load(), co = myCo(db);
      if (!setupStatus(co).ready) fail('Add your industry, a short description and at least one rule or fact first.');
      co.setupComplete = true; addActivity(co, 'Workspace opened to creators.'); save(db); return co;
    },
    async setApprovalMode(auto) {
      await wait(); const db = load(), co = myCo(db); co.autoApprove = !!auto;
      addActivity(co, auto ? 'Approval mode changed to: BrandLens may auto-approve clean posts.' : 'Approval mode changed to: manual approval for every post.');
      save(db); return co;
    },

    /* ---------- submissions ---------- */
    async listSubmissions() {
      await wait(); const db = load(), u = needUser(db);
      const list = u.role === 'creator' ? db.submissions.filter(s => s.creatorId === u.id)
                                        : db.submissions.filter(s => s.companyId === u.companyId && !['draft', 'ai_checked'].includes(s.status));
      return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(s => withCo(db, s));
    },
    async getSubmission(id) {
      await wait(); const db = load(), u = needUser(db);
      const s = db.submissions.find(x => x.id === id);
      if (!s || !((u.role === 'creator' && s.creatorId === u.id) || (u.role === 'company' && s.companyId === u.companyId))) fail('Submission not found.');
      if (u.role === 'company' && ['draft', 'ai_checked'].includes(s.status)) fail('Submission not found.');
      const out = withCo(db, s);
      if (u.role === 'company') { const cu = db.users.find(x => x.id === s.creatorId); out.creator = { name: s.creatorName, email: s.creatorEmail, since: cu && cu.createdAt, posts: db.submissions.filter(x => x.creatorId === s.creatorId && x.companyId === s.companyId && x.status !== 'draft').length }; }
      return out;
    },
    async saveDraft({ id, companyId, title, channel, text }) {
      await wait(); const db = load(), u = needUser(db, 'creator');
      title = (title || '').trim(); text = (text || '').trim();
      const tco = db.companies.find(c => c.id === companyId && c.setupComplete); if (!tco) fail('Choose a company.');
      if (!canWrite(accessOf(tco, u))) fail('You do not have access to write for ' + tco.name + '. Request access first.');
      if (!title) fail('Enter a content title.');
      if (text.length < 10) fail('Write at least a sentence of content.');
      let s;
      if (id) {
        s = ownSub(db, id, u); if (s.status !== 'draft') fail('Only drafts can be edited here.');
        Object.assign(s, { companyId, title, channel }); latest(s).text = text; addEvent(s, 'Draft saved.');
      } else {
        s = { id: uid('s'), no: null, companyId, creatorId: u.id, creatorName: u.name, creatorEmail: u.email, title, channel, status: 'draft',
          versions: [{ no: 1, text, at: now(), findings: null }], dismissed: [], comments: [], events: [], autoApproved: false, createdAt: now(), updatedAt: now() };
        addEvent(s, 'Draft created.'); db.submissions.push(s);
      }
      save(db); return withCo(db, s);
    },
    async analyse(id) {
      await wait(450); const db = load(), u = needUser(db, 'creator'), s = ownSub(db, id, u);
      if (!EDITABLE.includes(s.status)) fail('This submission can no longer be analysed.');
      const co = db.companies.find(c => c.id === s.companyId); runCheck(s, co);
      if (s.status === 'draft') s.status = 'ai_checked';
      addEvent(s, 'Content checked against ' + co.name + '’s approved knowledge — ' + latest(s).findings.length + ' finding(s).');
      save(db); return withCo(db, s);
    },
    async saveEdit(id, text) {
      await wait(300); const db = load(), u = needUser(db, 'creator'), s = ownSub(db, id, u);
      if (!EDITABLE.includes(s.status)) fail('This submission can no longer be edited.');
      text = (text || '').trim(); if (text.length < 10) fail('Content cannot be empty.');
      if (text === latest(s).text) return withCo(db, s);
      revise(db, s, db.companies.find(c => c.id === s.companyId), text, 'Edited manually'); save(db); return withCo(db, s);
    },
    async applyFix(id, fid) {
      await wait(250); const db = load(), u = needUser(db, 'creator'), s = ownSub(db, id, u);
      if (!EDITABLE.includes(s.status)) fail('This submission can no longer be edited.');
      const f = (latest(s).findings || []).find(x => x.id === fid); if (!f || !f.fix) fail('This finding has no automatic fix.');
      revise(db, s, db.companies.find(c => c.id === s.companyId), root.BrandCheck.applyFix(latest(s).text, f), 'Accepted suggestion for “' + (f.excerpt || f.category) + '”');
      save(db); return withCo(db, s);
    },
    async dismissFinding(id, fid) {
      await wait(150); const db = load(), u = needUser(db, 'creator'), s = ownSub(db, id, u);
      if (!EDITABLE.includes(s.status)) fail('This submission can no longer be edited.');
      const f = (latest(s).findings || []).find(x => x.id === fid); if (!f) fail('Finding not found.');
      f.decision = 'dismissed'; if (!s.dismissed.includes(f.key)) s.dismissed.push(f.key);
      addEvent(s, 'Dismissed finding: “' + (f.excerpt || f.category) + '”.'); save(db); return withCo(db, s);
    },
    async submitForReview(id) {
      await wait(350); const db = load(), u = needUser(db, 'creator'), s = ownSub(db, id, u);
      if (!['ai_checked', 'changes_requested'].includes(s.status) || !latest(s).findings) fail('Analyse the content before submitting.');
      const co = db.companies.find(c => c.id === s.companyId), first = s.status === 'ai_checked', clean = latest(s).findings.length === 0;
      if (!s.no) s.no = ++co.postCounter;
      s.submittedAt = now(); s.submittedVersions = s.submittedVersions || []; s.submittedVersions.push({ no: latest(s).no, at: now() });
      if (first && co.autoApprove && clean) {
        s.status = 'approved'; s.autoApproved = true;
        addEvent(s, 'Auto-approved by BrandLens: no findings and the company allows auto-approval.');
        addActivity(co, 'Post #' + s.no + ' “' + s.title + '” auto-approved by BrandLens.');
        notify(db, 'company', co.id, 'Post #' + s.no + ' “' + s.title + '” by ' + u.name + ' (' + u.email + ') was auto-approved by BrandLens.', 'review.html?id=' + s.id);
        notify(db, 'user', u.id, 'Your post “' + s.title + '” was approved.', 'report.html?id=' + s.id);
      } else {
        s.status = 'pending_review';
        addEvent(s, (first ? 'Submitted' : 'Resubmitted') + ' to ' + co.name + ' for review.');
        addActivity(co, 'Post #' + s.no + ' “' + s.title + '” ' + (first ? 'submitted' : 'resubmitted') + ' by ' + u.name + '.');
        notify(db, 'company', co.id, 'Post #' + s.no + ' “' + s.title + '” ' + (first ? 'submitted' : 'resubmitted') + ' by ' + u.name + ' (' + u.email + ').', 'review.html?id=' + s.id);
      }
      save(db); return withCo(db, s);
    },
    async decide(id, { decision, comment }) {
      await wait(300); const db = load(), co = myCo(db), u = needUser(db, 'company');
      const s = db.submissions.find(x => x.id === id && x.companyId === co.id) || fail('Submission not found.');
      if (s.status !== 'pending_review') fail('This post is not waiting for review.');
      const map = { approve: ['approved', 'approved'], changes: ['changes_requested', 'sent back for changes'], reject: ['rejected', 'rejected'] };
      if (!map[decision]) fail('Unknown decision.');
      comment = (comment || '').trim();
      if (decision !== 'approve' && !comment) fail('Add a comment explaining your decision.');
      if (comment) s.comments.push({ id: uid('c'), by: co.name, role: 'company', text: comment, at: now(), decision: map[decision][0] });
      s.status = map[decision][0]; addEvent(s, co.name + ' ' + map[decision][1] + ' this post.');
      addActivity(co, 'Post #' + s.no + ' “' + s.title + '” ' + map[decision][1] + '.');
      notify(db, 'user', s.creatorId, '“' + s.title + '” was ' + map[decision][1] + ' by ' + co.name + '.', 'report.html?id=' + s.id);
      save(db); return withCo(db, s);
    },
    async addComment(id, text) {
      await wait(150); const db = load(), u = needUser(db); text = (text || '').trim(); if (!text) fail('Write a comment first.');
      const s = db.submissions.find(x => x.id === id) || fail('Submission not found.');
      const isCo = u.role === 'company' && s.companyId === u.companyId, isCr = u.role === 'creator' && s.creatorId === u.id;
      if (!isCo && !isCr) fail('Submission not found.');
      const co = db.companies.find(c => c.id === s.companyId);
      s.comments.push({ id: uid('c'), by: isCo ? co.name : u.name, role: isCo ? 'company' : 'creator', text, at: now() }); s.updatedAt = now();
      if (isCo) notify(db, 'user', s.creatorId, co.name + ' commented on “' + s.title + '”.', 'report.html?id=' + s.id);
      else notify(db, 'company', co.id, u.name + ' commented on post #' + (s.no || '–') + ' “' + s.title + '”.', 'review.html?id=' + s.id);
      save(db); return withCo(db, s);
    },

    /* ---------- notifications & activity ---------- */
    async notifications() {
      const db = load(), u = curUser(db); if (!u) return [];
      return db.notifications.filter(n => (n.toType === 'company' && u.role === 'company' && n.toId === u.companyId) || (n.toType === 'user' && n.toId === u.id))
        .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40);
    },
    async markAllRead() {
      const db = load(), u = curUser(db); if (!u) return;
      db.notifications.forEach(n => { if ((n.toType === 'company' && n.toId === u.companyId) || (n.toType === 'user' && n.toId === u.id)) n.read = true; });
      save(db);
    },
    async activity() { await wait(100); const db = load(), co = myCo(db); return co.activity.slice().reverse(); },

    /* ---------- demo & sample data helpers ---------- */
    seeded: true,
    async ensureSeeded(force = false) {
      const db = load();
      const hasNova = db.companies.some(c => c.name === 'Nova Tech' || c.name === 'NovaTech');
      const hasCreator = db.users.some(u => u.email === 'shivampatil123@gmail.com');
      const hasSubmissions = (db.submissions || []).some(s => s.id === 's_post_1') && (db.submissions || []).some(s => s.id === 's_post_3');
      if (!force && hasNova && hasCreator && hasSubmissions) return;
      await this._seed(force);
    },
    async _seed(force = false) {
      let db = load();
      if (force || !db.companies || db.companies.length === 0) {
        db = emptyDb();
      }

      // Check or create Company Admin (Nova Tech)
      let cu = db.users.find(u => u.email === 'novatech12@gmail.com');
      if (cu) cu.pw = await hashPw('12345678');
      if (!cu) {
        cu = { id: 'u_novatech', role: 'company', name: 'Nova Tech', email: 'novatech12@gmail.com', pw: await hashPw('12345678'), createdAt: now() };
        db.users.push(cu);
      }
      // Also alias admin@novatech.test
      if (!db.users.some(u => u.email === 'admin@novatech.test')) {
        db.users.push({ id: 'u_novatech_alias', role: 'company', name: 'Nova Tech', email: 'admin@novatech.test', pw: await hashPw('12345678'), createdAt: now(), companyId: 'c_novatech' });
      }

      // Check or create Creator (Shivam Patil)
      let cr = db.users.find(u => u.email === 'shivampatil123@gmail.com');
      if (cr) cr.pw = await hashPw('12345678');
      if (!cr) {
        cr = { id: 'u_creator', role: 'creator', name: 'Shivam Patil', email: 'shivampatil123@gmail.com', pw: await hashPw('12345678'), createdAt: now() };
        db.users.push(cr);
      }
      // Also alias creator@test.dev
      if (!db.users.some(u => u.email === 'creator@test.dev')) {
        db.users.push({ id: 'u_creator_alias', role: 'creator', name: 'Shivam Patil', email: 'creator@test.dev', pw: await hashPw('12345678'), createdAt: now() });
      }

      // Company profile & brand rules
      let co = db.companies.find(c => c.name === 'Nova Tech' || c.name === 'NovaTech');
      if (!co) {
        co = {
          id: 'c_novatech', name: 'Nova Tech', ownerId: cu.id, industry: 'Consumer Electronics', website: 'https://novatech.example',
          description: 'NovaTech designs affordable smartphones and accessories for everyday users in India. We combine premium build quality with accessible pricing and dependable customer support.',
          setupComplete: true, autoApprove: false, postCounter: 4, access: 'open',
          accessList: [{ userId: cr.id, name: cr.name, email: cr.email, requestedAt: '2026-11-01T09:00:00Z', status: 'approved', decidedAt: '2026-11-01T09:30:00Z' }],
          voice: {
            tone: 'Professional & Accessible', personality: 'Helpful, transparent and grounded', style: 'Short sentences, active voice',
            notes: 'Clear, friendly and honest. Avoid marketing hype or unsupported superlatives.', maxExclamations: 1, noAllCaps: true
          },
          knowledge: {
            facts: [
              { id: 'k_f1', text: 'The NovaTech X1 smartphone launched in March 2026 at ₹24,999 across India.' },
              { id: 'k_f2', text: 'The NovaTech X1 comes with an industry-leading 2-year manufacturer warranty.' },
              { id: 'k_f3', text: 'NovaTech customer support is available Monday to Saturday, 9 AM to 6 PM IST.' },
              { id: 'k_f4', text: 'NovaTech devices are packaged in 100% recyclable eco-friendly materials.' }
            ],
            terms: [
              { id: 'k_t1', avoid: 'cell phone', use: 'smartphone', severity: 'medium' },
              { id: 'k_t2', avoid: 'NovaTech Mobile', use: 'NovaTech', severity: 'medium' },
              { id: 'k_t3', avoid: 'cheap phone', use: 'affordable smartphone', severity: 'medium' }
            ],
            claims: [
              { id: 'k_c1', phrase: 'cheapest', safe: 'affordable', severity: 'high', note: 'Avoid comparative superlative claims without third-party market study validation.' },
              { id: 'k_c2', phrase: 'cheapest smartphones in india', safe: 'affordable smartphones in India', severity: 'high', note: 'Comparative claim requires official market study citation.' },
              { id: 'k_c3', phrase: 'lowest price guaranteed', safe: 'backed by our 2-year warranty', severity: 'critical', note: 'Absolute guarantees are restricted unless backed by company policy.' },
              { id: 'k_c4', phrase: 'guaranteed', safe: 'backed by our 2-year warranty', severity: 'high', note: 'Qualify guarantee with warranty specifics.' },
              { id: 'k_c5', phrase: 'best in india', safe: 'top-rated in its class', severity: 'high' }
            ],
            disclaimers: [
              { id: 'k_d1', text: '*Terms and conditions apply. Warranty valid with official invoice.', trigger: 'warranty, offer, discount, sale, launch', severity: 'high' }
            ]
          },
          activity: [
            { id: 'a_1', at: '2026-11-01T08:00:00Z', text: 'Company workspace registered for Nova Tech.', by: 'Nova Tech' },
            { id: 'a_2', at: '2026-11-01T08:30:00Z', text: 'Brand Knowledge rules and facts configured.', by: 'Nova Tech' },
            { id: 'a_3', at: '2026-11-01T09:30:00Z', text: 'Creator access approved for Shivam Patil.', by: 'Nova Tech' },
            { id: 'a_4', at: '2026-11-08T11:15:00Z', text: 'Post #1 “NovaTech X1 Official Launch Announcement” approved.', by: 'Nova Tech' },
            { id: 'a_5', at: '2026-11-08T15:00:00Z', text: 'Post #2 “Eco-Friendly Packaging Spotlight” approved.', by: 'Nova Tech' },
            { id: 'a_6', at: '2026-11-09T09:00:00Z', text: 'Post #4 “Weekend Flash Sale Preview” submitted by Shivam Patil.', by: 'Shivam Patil' }
          ],
          createdAt: '2026-11-01T08:00:00Z'
        };
        db.companies.push(co);
      }
      cu.companyId = co.id;

      // Seed submissions
      const s3Text = "Our brand offers the most cheapest smartphones in India. Everyone can get premium quality at the lowest price guaranteed!";
      const kCo = knowledgeOf(co);
      const s3Findings = (root.BrandCheck ? root.BrandCheck.analyse(s3Text, kCo) : []);

      db.submissions = [
        {
          id: 's_post_1', no: 1, companyId: co.id, creatorId: cr.id, creatorName: cr.name, creatorEmail: cr.email,
          title: 'NovaTech X1 Official Launch Announcement', channel: 'Instagram Post', status: 'approved',
          versions: [{
            no: 1,
            text: "Introducing the all-new NovaTech X1 smartphone! Engineered for incredible performance, stunning photos, and all-day battery life at ₹24,999 across India. Backed by our 2-year manufacturer warranty.\n\n*Terms and conditions apply. Warranty valid with official invoice.",
            at: '2026-11-08T10:00:00Z', checkedAt: '2026-11-08T10:05:00Z', findings: []
          }],
          dismissed: [],
          comments: [{ id: 'c_1', by: 'Nova Tech', role: 'company', text: 'Great launch copy! Accurate specs and compliant disclaimer. Approved.', at: '2026-11-08T11:15:00Z', decision: 'approved' }],
          events: [
            { at: '2026-11-08T10:00:00Z', text: 'Submitted to Nova Tech for review.' },
            { at: '2026-11-08T11:15:00Z', text: 'Nova Tech approved this post.' }
          ],
          autoApproved: false, submittedAt: '2026-11-08T10:00:00Z', createdAt: '2026-11-08T09:45:00Z', updatedAt: '2026-11-08T11:15:00Z'
        },
        {
          id: 's_post_2', no: 2, companyId: co.id, creatorId: cr.id, creatorName: cr.name, creatorEmail: cr.email,
          title: 'Eco-Friendly Packaging Spotlight', channel: 'LinkedIn Post', status: 'approved',
          versions: [{
            no: 1,
            text: "Did you know? Every NovaTech X1 smartphone arrives in 100% recyclable eco-friendly packaging. We believe great technology shouldn't cost the Earth.",
            at: '2026-11-08T14:30:00Z', checkedAt: '2026-11-08T14:35:00Z', findings: []
          }],
          dismissed: [],
          comments: [{ id: 'c_2', by: 'Nova Tech', role: 'company', text: 'Approved. Fits our brand voice perfectly.', at: '2026-11-08T15:00:00Z', decision: 'approved' }],
          events: [
            { at: '2026-11-08T14:30:00Z', text: 'Submitted to Nova Tech for review.' },
            { at: '2026-11-08T15:00:00Z', text: 'Nova Tech approved this post.' }
          ],
          autoApproved: false, submittedAt: '2026-11-08T14:30:00Z', createdAt: '2026-11-08T14:00:00Z', updatedAt: '2026-11-08T15:00:00Z'
        },
        {
          id: 's_post_3', no: 3, companyId: co.id, creatorId: cr.id, creatorName: cr.name, creatorEmail: cr.email,
          title: 'Festive Season Promotional Launch', channel: 'Instagram Post', status: 'ai_checked',
          versions: [{
            no: 1,
            text: s3Text,
            at: '2026-11-09T11:00:00Z', checkedAt: '2026-11-09T11:02:00Z', findings: s3Findings
          }],
          dismissed: [],
          comments: [],
          events: [
            { at: '2026-11-09T11:00:00Z', text: 'Draft created in Content Studio.' },
            { at: '2026-11-09T11:02:00Z', text: 'Content checked against Nova Tech’s approved knowledge — ' + s3Findings.length + ' finding(s).' }
          ],
          autoApproved: false, submittedAt: null, createdAt: '2026-11-09T11:00:00Z', updatedAt: '2026-11-09T11:02:00Z'
        },
        {
          id: 's_post_4', no: 4, companyId: co.id, creatorId: cr.id, creatorName: cr.name, creatorEmail: cr.email,
          title: 'Weekend Flash Sale Preview', channel: 'Advertisement', status: 'pending_review',
          versions: [{
            no: 1,
            text: "Upgrade your smartphone this weekend with NovaTech X1! Get unmatched power and reliability at ₹24,999 with our 2-year manufacturer warranty.\n\n*Terms and conditions apply. Warranty valid with official invoice.",
            at: '2026-11-09T09:00:00Z', checkedAt: '2026-11-09T09:05:00Z', findings: []
          }],
          dismissed: [],
          comments: [],
          events: [
            { at: '2026-11-09T09:00:00Z', text: 'Submitted to Nova Tech for review.' }
          ],
          autoApproved: false, submittedAt: '2026-11-09T09:00:00Z', createdAt: '2026-11-09T08:30:00Z', updatedAt: '2026-11-09T09:00:00Z'
        }
      ];

      // Seed notifications
      db.notifications = [
        { id: 'n_1', toType: 'company', toId: co.id, text: 'Post #4 “Weekend Flash Sale Preview” submitted by Shivam Patil (shivampatil123@gmail.com).', link: 'review.html?id=s_post_4', at: '2026-11-09T09:00:00Z', read: false },
        { id: 'n_2', toType: 'company', toId: co.id, text: 'Post #2 “Eco-Friendly Packaging Spotlight” was approved.', link: 'review.html?id=s_post_2', at: '2026-11-08T15:00:00Z', read: true },
        { id: 'n_3', toType: 'company', toId: co.id, text: 'Post #1 “NovaTech X1 Official Launch Announcement” was approved.', link: 'review.html?id=s_post_1', at: '2026-11-08T11:15:00Z', read: true },
        { id: 'n_4', toType: 'user', toId: cr.id, text: 'Your post #4 “Weekend Flash Sale Preview” was submitted to Nova Tech for review.', link: 'report.html?id=s_post_4', at: '2026-11-09T09:00:00Z', read: false },
        { id: 'n_5', toType: 'user', toId: cr.id, text: 'Your post #2 “Eco-Friendly Packaging Spotlight” was approved by Nova Tech.', link: 'report.html?id=s_post_2', at: '2026-11-08T15:00:00Z', read: true },
        { id: 'n_6', toType: 'user', toId: cr.id, text: 'Your post #1 “NovaTech X1 Official Launch Announcement” was approved by Nova Tech.', link: 'report.html?id=s_post_1', at: '2026-11-08T11:15:00Z', read: true }
      ];

      save(db);
    },
    _reset() { localStorage.removeItem(KEY); localStorage.removeItem(SKEY); sessionStorage.removeItem(SKEY); }
  };

  const qs = root.location ? root.location.search : '';
  if (/[?&]reset=1/.test(qs)) API._reset();
  API.ready = API.ensureSeeded(/[?&]seed=1/.test(qs));
  root.API = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
