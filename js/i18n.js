/* BrandLens Multi-Language Engine (English | हिन्दी | मराठी) — window.BrandI18n
   Clean Globe dropdown + lossless DOM text translation across Home, Auth, Company & Creator portals. */
(function (root) {
  'use strict';
  const LKEY = 'bl_lang_v1';

  const PHRASES = {
    // Navigation & Shell
    'Dashboard': { hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड' },
    'Brand Knowledge': { hi: 'ब्रांड नॉलेज', mr: 'ब्रँड नॉलेज' },
    'Review Requests': { hi: 'रिव्यू रिक्वेस्ट', mr: 'रिव्ह्यू विनंत्या' },
    'Insights': { hi: 'इनसाइट्स', mr: 'इनसाइट्स' },
    'Activity History': { hi: 'गतिविधि इतिहास', mr: 'ॲक्टिव्हिटी इतिहास' },
    'Settings': { hi: 'सेटिंग्स', mr: 'सेटिंग्ज' },
    'Find Companies': { hi: 'कंपनियाँ खोजें', mr: 'कंपन्या शोधा' },
    'New Content': { hi: 'नया कंटेंट', mr: 'नवीन कंटेंट' },
    'My Submissions': { hi: 'मेरे सबमिशन', mr: 'माझे सबमिशन्स' },
    'Log out': { hi: 'लॉग आउट', mr: 'लॉग आउट' },
    'Switch to Creator': { hi: 'क्रिएटर डेमो खोलें', mr: 'क्रिएटर डेमो उघडा' },
    'Switch to Company': { hi: 'कंपनी डेमो खोलें', mr: 'कंपनी डेमो उघडा' },
    'Company workspace': { hi: 'कंपनी वर्कस्पेस', mr: 'कंपनी वर्कस्पेस' },
    'Signed in as creator': { hi: 'क्रिएटर अकाउंट', mr: 'क्रिएटर अकाउंट' },

    // Home Page (index.html)
    'Create confidently.': { hi: 'विश्वास के साथ लिखें।', mr: 'आत्मविश्वासाने लिहा.' },
    'Stay on-brand.': { hi: 'हमेशा ऑन-ब्रांड रहें।', mr: 'नेहमी ब्रँडनुसार राहा.' },
    'One platform where brands and creators collaborate, create content and ensure every post follows brand guidelines.': {
      hi: 'एक ऐसा प्लेटफॉर्म जहाँ ब्रांड्स और क्रिएटर्स साथ मिलकर कंटेंट बनाते हैं और हर पोस्ट ब्रांड नियमों के अनुसार रहती है।',
      mr: 'एक असे व्यासपीठ जिथे ब्रँड्स आणि क्रिएटर्स एकत्र कंटेंट तयार करतात आणि प्रत्येक पोस्ट ब्रँड नियमांनुसार राहते.'
    },
    'For Companies': { hi: 'कंपनियों के लिए', mr: 'कंपन्यांसाठी' },
    'Manage your brand identity, review creator content and maintain brand consistency.': {
      hi: 'अपनी ब्रांड पहचान संभालें, क्रिएटर कंटेंट रिव्यू करें और ब्रांड की एकरूपता बनाए रखें।',
      mr: 'तुमची ब्रँड ओळख सांभाळा, क्रिएटर कंटेंट तपासा आणि ब्रँड सुसंगतता राखा.'
    },
    'For Creators': { hi: 'क्रिएटर्स के लिए', mr: 'क्रिएटर्ससाठी' },
    'Discover brands, create content, check guidelines and get approvals.': {
      hi: 'ब्रांड्स खोजें, कंटेंट लिखें, गाइडलाइन्स जांचें और तुरंत अप्रूवल पाएं।',
      mr: 'ब्रँड्स शोधा, कंटेंट लिहा, मार्गदर्शक तत्त्वे तपासा आणि मंजुरी मिळवा.'
    },
    'Demo Account': { hi: 'डेमो अकाउंट', mr: 'डेमो अकाउंट' },
    'Get Started': { hi: 'शुरू करें', mr: 'सुरू करा' },

    // Dashboards & Common Actions
    'Recent submissions': { hi: 'हालिया सबमिशन', mr: 'अलीकडील सबमिशन्स' },
    'Recent activity': { hi: 'हालिया गतिविधि', mr: 'अलीकडील घडामोडी' },
    'Full history': { hi: 'पूरा इतिहास', mr: 'संपूर्ण इतिहास' },
    'View all': { hi: 'सभी देखें', mr: 'सर्व पहा' },
    'Updates': { hi: 'अपडेट्स', mr: 'अपडेट्स' },
    'Start something new': { hi: 'कुछ नया शुरू करें', mr: 'काहीतरी नवीन सुरू करा' },
    'Create content': { hi: 'कंटेंट बनाएं', mr: 'कंटेंट तयार करा' },
    'Find a company': { hi: 'कंपनी खोजें', mr: 'कंपनी शोधा' },
    'Pending reviews': { hi: 'लंबित रिव्यू', mr: 'प्रलंबित रिव्ह्यू' },
    'Total submissions': { hi: 'कुल सबमिशन', mr: 'एकूण सबमिशन्स' },
    'Approved content': { hi: 'स्वीकृत कंटेंट', mr: 'मंजूर कंटेंट' },
    'Rejected content': { hi: 'अस्वीकृत कंटेंट', mr: 'नाकारलेले कंटेंट' },
    'Changes requested': { hi: 'सुधार आवश्यक', mr: 'बदल सुचवलेले' },
    'Total posts': { hi: 'कुल पोस्ट', mr: 'एकूण पोस्ट' },
    'Drafts': { hi: 'ड्राफ्ट्स', mr: 'मसुदे' },
    'Under review': { hi: 'समीक्षा में', mr: 'तपासणीखाली' },
    'Approved posts': { hi: 'स्वीकृत पोस्ट', mr: 'मंजूर पोस्ट' },
    'Save draft': { hi: 'ड्राफ्ट सेव करें', mr: 'मसुदा सेव्ह करा' },
    'Check content': { hi: 'कंटेंट जांचें', mr: 'कंटेंट तपासा' },
    'Check again': { hi: 'दोबारा जांचें', mr: 'पुन्हा तपासा' },
    'Submit for approval': { hi: 'अप्रूवल के लिए भेजें', mr: 'मंजुरीसाठी पाठवा' },
    'Delete': { hi: 'हटाएं', mr: 'हटवा' },
    'Live Preview': { hi: 'लाइव प्रीव्यू', mr: 'लाइव्ह प्रिव्ह्यू' },
    'Content Studio': { hi: 'कंटेंट स्टूडियो', mr: 'कंटेंट स्टुडिओ' },
    'Brand Profile': { hi: 'ब्रांड प्रोफाइल', mr: 'ब्रँड प्रोफाइल' },
    'Brand Voice': { hi: 'ब्रांड वॉइस', mr: 'ब्रँड व्हॉइस' },
    'Brand Rules': { hi: 'ब्रांड नियम', mr: 'ब्रँड नियम' },
    'Approved Facts': { hi: 'स्वीकृत तथ्य', mr: 'मंजूर तथ्ये' },
    'Brand Assets & Visuals': { hi: 'ब्रांड एसेट्स व विजुअल्स', mr: 'ब्रँड ॲसेट्स आणि व्हिज्युअल्स' },
    'Creator Access': { hi: 'क्रिएटर एक्सेस', mr: 'क्रिएटर प्रवेश' },
    'Governance Insights': { hi: 'गवर्नेंस इनसाइट्स', mr: 'गव्हर्नन्स इनसाइट्स' },
    'Activity & Audit History': { hi: 'गतिविधि और ऑडिट इतिहास', mr: 'ॲक्टिव्हिटी आणि ऑडिट इतिहास' },
    'Review': { hi: 'रिव्यू करें', mr: 'रिव्ह्यू करा' },
    'View': { hi: 'देखें', mr: 'पहा' },
    'Continue': { hi: 'जारी रखें', mr: 'पुढे चालू ठेवा' }
  };

  const LANGS = {
    en: { code: 'EN', label: 'English' },
    hi: { code: 'हिन्दी', label: 'हिन्दी (Hindi)' },
    mr: { code: 'मराठी', label: 'मराठी (Marathi)' }
  };

  const origText = new WeakMap();
  let observer = null, applying = false, debounceTimer = null;

  function getLang() {
    try { const l = localStorage.getItem(LKEY); if (LANGS[l]) return l; } catch (e) {}
    return 'en';
  }
  function setLang(l) {
    if (!LANGS[l]) return;
    try { localStorage.setItem(LKEY, l); } catch (e) {}
    apply();
    document.querySelectorAll('.bl-lang-menu').forEach(m => m.style.display = 'none');
    document.querySelectorAll('.bl-lang-cur').forEach(s => s.textContent = LANGS[l].code);
  }

  function translateTextNodes(rootNode, lang) {
    if (!rootNode || typeof document === 'undefined') return;
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || tag === 'TEXTAREA' || tag === 'INPUT' || p.closest('.bl-lang-dd')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while ((node = walker.nextNode())) {
      const raw = node.nodeValue;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      if (!origText.has(node)) {
        if (PHRASES[trimmed]) origText.set(node, raw);
      }
      const baseRaw = origText.get(node);
      if (baseRaw) {
        const baseTrim = baseRaw.trim();
        const target = lang === 'en' ? baseTrim : (PHRASES[baseTrim] && PHRASES[baseTrim][lang]) || baseTrim;
        const lead = baseRaw.match(/^\s*/)[0], trail = baseRaw.match(/\s*$/)[0];
        const nextVal = lead + target + trail;
        if (node.nodeValue !== nextVal) node.nodeValue = nextVal;
      }
    }
  }

  function apply() {
    if (applying || typeof document === 'undefined') return;
    applying = true;
    try {
      const cur = getLang();
      document.documentElement.lang = cur;
      translateTextNodes(document.body, cur);
      document.querySelectorAll('.bl-lang-cur').forEach(s => s.textContent = LANGS[cur].code);
      document.querySelectorAll('[data-set-lang]').forEach(btn => {
        const k = btn.getAttribute('data-set-lang');
        const active = k === cur;
        btn.textContent = LANGS[k].label + (active ? ' ✓' : '');
        btn.style.fontWeight = active ? '700' : '500';
        btn.style.background = active ? '#EEF2FF' : 'transparent';
        btn.style.color = active ? '#4F46E5' : '#0F172A';
      });
    } finally {
      applying = false;
    }
  }

  function switcherHtml() {
    const cur = getLang();
    return `<div class="bl-lang-dd" style="position:relative;display:inline-block">
      <button type="button" class="bl-lang-btn" style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;border:1px solid var(--line,#CBD5E1);background:#FFFFFF;color:#0F172A;font-size:.82rem;font-weight:600;cursor:pointer" aria-label="Select Language">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
        <span class="bl-lang-cur">${LANGS[cur].code}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="bl-lang-menu" style="display:none;position:absolute;right:0;top:calc(100% + 6px);min-width:155px;background:#FFFFFF;border:1px solid var(--line,#CBD5E1);border-radius:10px;box-shadow:0 10px 25px rgba(15,23,42,.12);padding:4px;z-index:999">
        ${['en', 'hi', 'mr'].map(k => `<button type="button" data-set-lang="${k}" style="display:flex;align-items:center;justify-content:space-between;width:100%;text-align:left;border:0;padding:8px 10px;border-radius:7px;font-size:.82rem;cursor:pointer;background:${cur === k ? '#EEF2FF' : 'transparent'};color:${cur === k ? '#4F46E5' : '#0F172A'};font-weight:${cur === k ? '700' : '500'}">${LANGS[k].label}${cur === k ? ' ✓' : ''}</button>`).join('')}
      </div>
    </div>`;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('click', e => {
      const toggle = e.target.closest('.bl-lang-btn');
      if (toggle) {
        e.stopPropagation();
        const menu = toggle.parentElement.querySelector('.bl-lang-menu');
        const open = menu.style.display === 'block';
        document.querySelectorAll('.bl-lang-menu').forEach(m => m.style.display = 'none');
        menu.style.display = open ? 'none' : 'block';
        return;
      }
      const opt = e.target.closest('[data-set-lang]');
      if (opt) {
        const l = opt.getAttribute('data-set-lang');
        setLang(l);
        if (root.UI && root.UI.toast) root.UI.toast('Language: ' + LANGS[l].label, 'ok');
        return;
      }
      document.querySelectorAll('.bl-lang-menu').forEach(m => m.style.display = 'none');
    });

    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        if (applying || getLang() === 'en') return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => apply(), 40);
      });
      if (document.body) observer.observe(document.body, { childList: true, subtree: true });
      else document.addEventListener('DOMContentLoaded', () => observer.observe(document.body, { childList: true, subtree: true }));
    }
  }

  root.BrandI18n = { getLang, setLang, switcherHtml, apply, PHRASES, LANGS };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.BrandI18n;
})(typeof window !== 'undefined' ? window : globalThis);
