/* BrandLens Responsible AI Trust Suite (window.BrandTrust):
   - Client-side PII & confidential data detection and masking
   - Cross-tab live synchronization via BroadcastChannel
   - Exportable Compliance & Human-Decision Audit Reports (CSV / JSON) */
(function (root) {
  'use strict';

  const PII_RULES = [
    { type: 'EMAIL', label: 'Email address', re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, token: '[REDACTED_EMAIL]' },
    { type: 'PHONE', label: 'Phone number', re: /(?:\+91[\s-]?)?[6-9]\d{9}\b/g, token: '[REDACTED_PHONE]' },
    { type: 'CARD', label: 'Card / Account number', re: /\b\d{4}(?:[ -]?\d{4}){2,3}\b/g, token: '[REDACTED_CARD]' },
    { type: 'PAN', label: 'PAN ID', re: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, token: '[REDACTED_PAN]' },
    { type: 'API_KEY', label: 'API Key / Token', re: /\b(?:sk-[A-Za-z0-9_-]{12,}|AIza[0-9A-Za-z_-]{20,})\b/g, token: '[REDACTED_SECRET]' }
  ];

  function scanPII(text) {
    const src = String(text || '');
    const items = [];
    for (const rule of PII_RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(src))) {
        items.push({ type: rule.type, label: rule.label, value: m[0], start: m.index, end: m.index + m[0].length, token: rule.token });
      }
    }
    return { hasPII: items.length > 0, count: items.length, items };
  }

  function maskPII(text) {
    let out = String(text || '');
    const found = [];
    for (const rule of PII_RULES) {
      rule.re.lastIndex = 0;
      out = out.replace(rule.re, match => {
        found.push({ type: rule.type, label: rule.label, original: match, replacement: rule.token });
        return rule.token;
      });
    }
    return { maskedText: out, count: found.length, found };
  }

  /* Cross-tab real-time sync channel */
  let bc = null;
  try {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') bc = new BroadcastChannel('brandlens_sync_v1');
  } catch (e) {}

  function broadcast(event, payload) {
    try { if (bc) bc.postMessage({ event, payload, at: Date.now() }); } catch (e) {}
  }
  function onSync(handler) {
    if (!bc) return () => {};
    const fn = e => handler && handler(e.data);
    bc.addEventListener('message', fn);
    return () => bc.removeEventListener('message', fn);
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 200);
  }

  function csvEsc(v) {
    const s = String(v == null ? '' : v).replace(/"/g, '""');
    return `"${s}"`;
  }

  function exportAuditCSV(submissions, companyName) {
    const headers = ['Submission ID', 'Post #', 'Title', 'Channel', 'Creator', 'Status', 'Engine Mode', 'Findings Count', 'False Alarms', 'PII Masked', 'Submitted At', 'Last Updated'];
    const rows = (submissions || []).map(s => {
      const latest = s.versions[s.versions.length - 1] || { findings: [] };
      const allF = (latest.findings || []).concat(s.visionFindings || []);
      const faCount = allF.filter(f => f.decision === 'false_alarm').length;
      const mode = s.image ? 'Deterministic + Vision Scanner' : 'Deterministic Rule Engine';
      return [
        s.id, '#' + s.no, s.title, s.channel, s.creatorName, s.status, mode,
        allF.length, faCount, s.piiMasked ? 'Yes' : 'No', s.submittedAt || 'Draft', s.updatedAt
      ].map(csvEsc).join(',');
    });
    const csv = [headers.map(csvEsc).join(','), ...rows].join('\n');
    const slug = String(companyName || 'brandlens').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadFile(`${slug}-audit-report-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
  }

  function exportAuditJSON(submissions, companyName, activity) {
    const payload = {
      exportedAt: new Date().toISOString(),
      workspace: companyName || 'BrandLens',
      governancePolicy: 'Human-in-the-loop (Advisory automated checks; 100% human final approval)',
      summary: {
        totalSubmissions: (submissions || []).length,
        approved: (submissions || []).filter(s => s.status === 'approved').length,
        pendingReview: (submissions || []).filter(s => s.status === 'pending_review').length,
        withVisualAssets: (submissions || []).filter(s => !!s.image).length
      },
      submissions: (submissions || []).map(s => ({
        id: s.id, no: s.no, title: s.title, channel: s.channel, creator: s.creatorName,
        status: s.status, piiMasked: !!s.piiMasked, hasImage: !!s.image,
        versionsCount: s.versions.length, events: s.events, comments: s.comments
      })),
      companyActivityLog: activity || []
    };
    const slug = String(companyName || 'brandlens').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadFile(`${slug}-audit-report-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
  }

  root.BrandTrust = { scanPII, maskPII, broadcast, onSync, exportAuditCSV, exportAuditJSON };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.BrandTrust;
})(typeof window !== 'undefined' ? window : globalThis);
