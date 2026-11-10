/* BrandLens rule checker — frontend MOCK of the review pipeline.
   This is deterministic RULE MATCHING, not an AI language model. A real LLM layer must run on the backend.
   Works in the browser (window.BrandCheck) and in Node (module.exports) so it can be unit-tested.

   Finding groups (shown to users):
     violation   = Rule violation        (terminology, missing disclaimer, grammar) status: confirmed_mismatch
     unsupported = Unsupported claim     (claims/figures with no approved fact)     status: needs_verification
     tone        = Brand tone mismatch   (exclamations, ALL CAPS)                   status: potential_issue
     improvement = Improvement suggestion (optional writing advice)                 status: suggestion
   Severities: critical | high | medium | info */
(function (root) {
  'use strict';

  const GENERAL_CLAIMS = [
    { p: 'guarantees', hint: 'Rewrite as: “is designed to help improve results.”' },
    { p: 'guaranteed', hint: 'Rewrite as: “is designed to help improve results.”' },
    { p: 'guarantee', hint: 'Rewrite as: “is designed to help improve results.”' },
    { p: 'lowest price guaranteed', hint: 'Use approved warranty or price match disclaimer.' },
    { p: '100%', hint: 'Remove the percentage or use a figure from your approved facts.' },
    { p: 'cheapest smartphones in india', hint: 'Comparative claim requires official third-party validation.' },
    { p: 'cheapest' }, { p: 'lowest price' }, { p: 'best in' }, { p: 'number one' }, { p: 'no. 1' }, { p: '#1' },
    { p: "world's best" }, { p: "world's first" }, { p: 'risk-free' }, { p: 'risk free' }, { p: 'unbeatable' },
    { p: 'fastest' }, { p: 'miracle' }, { p: 'instant results' }
  ];
  const WEIGHT = { critical: 25, high: 15, medium: 8, info: 2 };
  const GROUP = { terminology: 'violation', disclaimer: 'violation', grammar: 'violation', claim: 'unsupported', fact: 'unsupported', tone: 'tone', improvement: 'improvement' };
  const SEV = new Set(['critical', 'high', 'medium', 'info']);
  const sev = (v, d) => (SEV.has(v) ? v : d);

  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const matchCase = (orig, rep) => (orig[0] !== orig[0].toLowerCase() && rep) ? rep[0].toUpperCase() + rep.slice(1) : rep;

  function findAll(text, phrase) {
    const out = [];
    if (!phrase) return out;
    const re = new RegExp('(?<![A-Za-z0-9_])' + reEsc(phrase) + '(?![A-Za-z0-9_])', 'gi');
    let m;
    while ((m = re.exec(text))) {
      out.push({ start: m.index, end: m.index + m[0].length, match: m[0] });
      if (!m[0].length) re.lastIndex++;
    }
    return out;
  }

  function analyse(text, k, opts) {
    text = String(text || ''); k = k || {}; opts = opts || {};
    const company = k.companyName || 'the company';
    const facts = (k.facts || []).map(f => norm(f.text));
    const out = [];
    const push = f => out.push(Object.assign({ decision: null, fix: null, start: -1, end: -1 }, f));
    const clash = (s, e) => out.some(f => f.start >= 0 && f.start < e && s < f.end && f.category !== 'grammar');

    // 0. Grammar & Style checks (e.g. double superlatives / double comparatives)
    const GRAMMAR_PATTERNS = [
      { re: /\bmost cheapest\b/gi, fix: 'cheapest', rule: 'Grammar: avoid double superlatives like “most cheapest”. Use “cheapest” or “most affordable”.' },
      { re: /\bmore cheaper\b/gi, fix: 'cheaper', rule: 'Grammar: avoid double comparatives like “more cheaper”. Use “cheaper” or “more affordable”.' },
      { re: /\bmost fastest\b/gi, fix: 'fastest', rule: 'Grammar: use “fastest” instead of “most fastest”.' },
      { re: /\bmore better\b/gi, fix: 'better', rule: 'Grammar: use “better” instead of “more better”.' },
      { re: /\bmost best\b/gi, fix: 'best', rule: 'Grammar: use “best” instead of “most best”.' }
    ];
    for (const gp of GRAMMAR_PATTERNS) {
      let gm;
      while ((gm = gp.re.exec(text))) {
        push({
          category: 'grammar',
          severity: 'medium',
          status: 'confirmed_mismatch',
          excerpt: gm[0],
          start: gm.index,
          end: gm.index + gm[0].length,
          reason: '“' + gm[0] + '” is grammatically incorrect (double superlative).',
          rule: gp.rule,
          evidence: 'Standard English grammar rules.',
          suggestion: 'Replace with “' + gp.fix + '”.',
          fix: { type: 'replace', text: matchCase(gm[0], gp.fix) }
        });
      }
    }

    // 1. Terminology (clear company rule -> confirmed rule violation)
    for (const t of (k.terms || [])) {
      if (!t.avoid) continue;
      for (const m of findAll(text, t.avoid)) {
        push({ category: 'terminology', severity: sev(t.severity, 'medium'), status: 'confirmed_mismatch', excerpt: m.match, start: m.start, end: m.end,
          reason: '“' + m.match + '” is not an approved term.',
          rule: 'Terminology: use “' + t.use + '” instead of “' + t.avoid + '”.',
          evidence: 'Brand rule set by ' + company + '.',
          suggestion: t.use ? 'Replace with “' + t.use + '”.' : 'Remove this term.',
          fix: t.use ? { type: 'replace', text: matchCase(m.match, t.use) } : null });
      }
    }

    // 2. Promotional claims with no approved fact behind them (unverified, NOT proven false)
    const seen = new Set(), claimList = [];
    for (const c of (k.claims || [])) if (c.phrase) { claimList.push({ phrase: c.phrase, safe: c.safe, severity: sev(c.severity, 'high'), source: 'claims' }); seen.add(c.phrase.toLowerCase()); }
    for (const g of GENERAL_CLAIMS) if (!seen.has(g.p.toLowerCase())) claimList.push({ phrase: g.p, hint: g.hint, severity: g.p.includes('guarantee') ? 'critical' : 'high', source: 'general' });
    
    // Sort longer phrases first so specific phrases like "cheapest smartphones in India" match before "cheapest"
    claimList.sort((a, b) => b.phrase.length - a.phrase.length);

    for (const c of claimList) {
      const p = norm(c.phrase);
      if (facts.some(f => f.includes(p))) continue; // supported by an approved fact
      for (const m of findAll(text, c.phrase)) {
        if (clash(m.start, m.end)) continue;
        push({ category: 'claim', severity: c.severity, status: 'needs_verification', excerpt: m.match, start: m.start, end: m.end,
          reason: '“' + m.match + '” is a promotional claim and ' + company + ' has not supplied approved evidence for it.',
          rule: c.source === 'claims' ? 'Claims: “' + c.phrase + '” needs an approved fact before use.' : 'General policy: absolute or comparative claims need approved evidence.',
          evidence: 'No approved fact contains “' + c.phrase + '”. This does not prove the claim is false; it is unverified.',
          suggestion: c.safe ? 'Use the approved wording: “' + c.safe + '”.' : (c.hint || 'Remove or soften this wording, or ask the company to add an approved fact that supports it.'),
          fix: c.safe ? { type: 'replace', text: matchCase(m.match, c.safe) } : null });
      }
    }

    // 3. Prices / percentages that do not appear in any approved fact
    const reNum = /(?:₹|(?<![A-Za-z])(?:Rs\.?|INR)\s?|\$|€|£)\s?\d[\d,]*(?:\.\d+)?|\d+(?:\.\d+)?\s?%/gi;
    let m;
    while ((m = reNum.exec(text))) {
      const raw = m[0].replace(/[,\s]+$/, ''), s = m.index, e = s + raw.length;
      if (clash(s, e)) continue;
      const key = norm(raw).replace(/[,\s]/g, '');
      if (facts.some(f => f.replace(/[,\s]/g, '').includes(key))) continue;
      push({ category: 'fact', severity: 'medium', status: 'needs_verification', excerpt: raw, start: s, end: e,
        reason: 'The figure “' + raw + '” is not in any approved fact.',
        rule: 'Facts & figures must match the approved company facts.',
        evidence: 'No approved fact contains “' + raw + '”.',
        suggestion: 'Confirm the figure with the company, or remove it.', fix: null });
    }

    // 4. Required disclaimers
    for (const d of (k.disclaimers || [])) {
      const dtext = String(d.text || '').trim();
      if (!dtext) continue;
      const triggers = String(d.trigger || '').split(',').map(s => s.trim()).filter(Boolean);
      let hit = null;
      if (triggers.length) {
        for (const t of triggers) { const r = findAll(text, t)[0]; if (r) { hit = r; break; } }
        if (!hit) continue;
      }
      if (norm(text).includes(norm(dtext))) continue;
      const ok = hit && !clash(hit.start, hit.end);
      push({ category: 'disclaimer', severity: sev(d.severity, 'high'), status: 'confirmed_mismatch',
        excerpt: hit ? hit.match : '', start: ok ? hit.start : -1, end: ok ? hit.end : -1,
        reason: 'A required disclaimer is missing' + (hit ? ' (the post mentions “' + hit.match + '”).' : '.'),
        rule: 'Disclaimer: “' + dtext + '”' + (triggers.length ? ' is required when the post mentions ' + triggers.join(', ') + '.' : ' is required on every post.'),
        evidence: 'Brand rule set by ' + company + '.',
        suggestion: 'Add this line to the end of the post:', fix: { type: 'append', text: dtext } });
    }

    // 5. Brand voice (tone)
    const v = k.voice || {};
    if (Number.isFinite(v.maxExclamations) && v.maxExclamations >= 0) {
      const re = /!+/g; let count = 0, mm;
      while ((mm = re.exec(text))) {
        count++; if (count <= v.maxExclamations) continue;
        const before = text.slice(0, mm.index); let s = 0; const rb = /[.?!]\s+|\n/g; let x;
        while ((x = rb.exec(before))) s = x.index + x[0].length;
        const e = mm.index + mm[0].length;
        if (clash(s, e)) s = mm.index;
        if (clash(s, e)) continue;
        const ex = text.slice(s, e);
        push({ category: 'tone', severity: 'info', status: 'potential_issue', excerpt: ex, start: s, end: e,
          reason: 'Too many exclamation marks (limit: ' + v.maxExclamations + ').',
          rule: 'Brand voice: at most ' + v.maxExclamations + ' exclamation mark(s) per post.',
          evidence: 'Brand voice settings of ' + company + '.',
          suggestion: 'End the sentence with a full stop.', fix: { type: 'replace', text: ex.replace(/!+$/, '.') } });
      }
    }
    if (v.noAllCaps) {
      const re = /\b[A-Z]{4,}(?:\s+[A-Z]{2,})*\b/g; let mm;
      while ((mm = re.exec(text))) {
        const w = mm[0], s = mm.index, e = s + w.length;
        if (norm(w) === norm(company) || clash(s, e)) continue;
        const fixed = w[0] + w.slice(1).toLowerCase();
        push({ category: 'tone', severity: 'info', status: 'potential_issue', excerpt: w, start: s, end: e,
          reason: 'All-caps text can read as shouting.', rule: 'Brand voice: avoid all-caps words.',
          evidence: 'Brand voice settings of ' + company + '.', suggestion: 'Use “' + fixed + '”.', fix: { type: 'replace', text: fixed } });
      }
    }

    // 6. Optional improvement suggestions (never counted as violations)
    const reS = /[^.!?\n]+[.!?]*/g; let sm;
    while ((sm = reS.exec(text))) {
      const raw = sm[0], lead = raw.length - raw.trimStart().length, s = sm.index + lead, e = sm.index + raw.trimEnd().length;
      const words = raw.trim().split(/\s+/).filter(Boolean).length;
      if (words < 35 || clash(s, e)) continue;
      push({ category: 'improvement', severity: 'info', status: 'suggestion', excerpt: text.slice(s, e), start: s, end: e,
        reason: 'This sentence is ' + words + ' words long and may be hard to read on social media.',
        rule: 'Writing quality (optional): aim for sentences under 30 words.',
        evidence: 'General writing guidance, not a company rule.', suggestion: 'Split it into two shorter sentences.', fix: null });
    }

    out.sort((a, b) => (a.start < 0 ? 1e9 : a.start) - (b.start < 0 ? 1e9 : b.start));
    const dis = new Set(opts.dismissedKeys || []);
    out.forEach((f, i) => { f.id = 'f' + (i + 1); f.group = GROUP[f.category]; f.key = f.category + '|' + norm(f.excerpt || f.rule); if (dis.has(f.key)) f.decision = 'dismissed'; });
    return out;
  }

  const open = f => (f || []).filter(x => x.decision !== 'dismissed');
  const sevOf = f => (f.severity === 'low' ? 'info' : f.severity);

  function counts(findings) {
    const f = findings || [], o = open(f), by = g => o.filter(x => (x.group || GROUP[x.category]) === g).length;
    return { total: f.length, open: o.length, dismissed: f.length - o.length,
      confirmed: o.filter(x => x.status === 'confirmed_mismatch').length, potential: o.filter(x => x.status === 'potential_issue').length,
      verify: o.filter(x => x.status === 'needs_verification').length, suggestions: o.filter(x => x.status === 'suggestion').length,
      critical: o.filter(x => sevOf(x) === 'critical').length, high: o.filter(x => sevOf(x) === 'high' || sevOf(x) === 'critical').length,
      violation: by('violation'), unsupported: by('unsupported'), tone: by('tone'), improvement: by('improvement') };
  }

  // Transparent score: start at 100, subtract a fixed amount for each OPEN finding by severity. Dismissed findings do not count.
  function score(findings) {
    const o = open(findings), rows = [];
    let total = 0;
    for (const s of ['critical', 'high', 'medium', 'info']) {
      const n = o.filter(x => sevOf(x) === s).length;
      if (n) { rows.push({ severity: s, count: n, each: WEIGHT[s], points: n * WEIGHT[s] }); total += n * WEIGHT[s]; }
    }
    const value = Math.max(0, 100 - total);
    return { value, rows, total, label: value >= 90 ? 'Ready to submit' : value >= 70 ? 'Needs minor fixes' : value >= 40 ? 'Needs work' : 'Major issues' };
  }

  function applyFix(text, f) {
    if (!f || !f.fix) return text;
    if (f.fix.type === 'replace' && f.start >= 0) return text.slice(0, f.start) + f.fix.text + text.slice(f.end);
    if (f.fix.type === 'append') return text.replace(/\s+$/, '') + '\n\n' + f.fix.text;
    return text;
  }

  const api = { analyse, counts, score, applyFix, findAll, WEIGHT, GROUP };
  root.BrandCheck = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
