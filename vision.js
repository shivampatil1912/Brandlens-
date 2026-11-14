/* BrandLens Multimodal Vision & Image Accessibility Scanner (window.BrandVision).
   Performs client-side Canvas pixel analysis:
   - Dominant color extraction + CIELAB (Delta-E) distance against approved brand hex palette
   - WCAG 2.1 AA contrast ratio verification (>= 4.5:1)
   - Aspect ratio & edge clear-space padding inspection
   - Automated Alt-Text generation & missing alt-text compliance check */
(function (root) {
  'use strict';

  function hexToRgb(hex) {
    const h = String(hex || '').replace('#', '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  function relLuminance([r, g, b]) {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function contrastRatio(rgb1, rgb2) {
    const l1 = relLuminance(rgb1), l2 = relLuminance(rgb2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function rgbToLab([r, g, b]) {
    let sr = r / 255, sg = g / 255, sb = b / 255;
    sr = sr > 0.04045 ? Math.pow((sr + 0.055) / 1.055, 2.4) : sr / 12.92;
    sg = sg > 0.04045 ? Math.pow((sg + 0.055) / 1.055, 2.4) : sg / 12.92;
    sb = sb > 0.04045 ? Math.pow((sb + 0.055) / 1.055, 2.4) : sb / 12.92;
    let x = (sr * 0.4124 + sg * 0.3576 + sb * 0.1805) / 0.95047;
    let y = (sr * 0.2126 + sg * 0.7152 + sb * 0.0722) / 1.00000;
    let z = (sr * 0.0193 + sg * 0.1192 + sb * 0.9505) / 1.08883;
    const f = t => t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
    x = f(x); y = f(y); z = f(z);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  function deltaE(rgb1, rgb2) {
    const [L1, a1, b1] = rgbToLab(rgb1), [L2, a2, b2] = rgbToLab(rgb2);
    return Math.sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
  }


  function generateSampleLogo(name = 'Nova Tech') {
    if (typeof document === 'undefined') return '';
    const c = document.createElement('canvas');
    c.width = 240; c.height = 80;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1E3A5F';
    ctx.fillRect(0, 0, 240, 80);
    ctx.fillStyle = '#0D9488';
    ctx.fillRect(14, 16, 48, 48);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(name.slice(0, 2).toUpperCase(), 21, 49);
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(name, 74, 48);
    return c.toDataURL('image/png');
  }

  async function verifyLogoInImage(postCanvas, logoDataUrl) {
    if (!logoDataUrl) return { checked: false, verified: false, confidence: 0 };
    try {
      const logoImg = await loadImage(logoDataUrl);
      const lw = 32, lh = 16;
      const lc = document.createElement('canvas');
      lc.width = lw; lc.height = lh;
      const lctx = lc.getContext('2d');
      lctx.drawImage(logoImg, 0, 0, lw, lh);
      const ldata = lctx.getImageData(0, 0, lw, lh).data;

      // Extract logo dominant signature color
      let lr = 0, lg = 0, lb = 0, n = 0;
      for (let i = 0; i < ldata.length; i += 4) {
        if (ldata[i + 3] > 128) { lr += ldata[i]; lg += ldata[i + 1]; lb += ldata[i + 2]; n++; }
      }
      if (!n) return { checked: false, verified: false, confidence: 0 };
      const logoAvg = [lr / n, lg / n, lb / n];

      // Compare against 4 corner regions of the post image (top-left, top-right, bottom-left, bottom-right)
      const pw = postCanvas.width, ph = postCanvas.height;
      const pctx = postCanvas.getContext('2d');
      const rw = Math.max(8, Math.floor(pw * 0.32)), rh = Math.max(6, Math.floor(ph * 0.25));
      const regions = [[0, 0], [pw - rw, 0], [0, ph - rh], [pw - rw, ph - rh]];
      let bestScore = 0;
      for (const [rx, ry] of regions) {
        const pd = pctx.getImageData(rx, ry, rw, rh).data;
        let matchPx = 0, totalPx = 0;
        for (let i = 0; i < pd.length; i += 4) {
          totalPx++;
          const d = deltaE([pd[i], pd[i + 1], pd[i + 2]], logoAvg);
          if (d < 28) matchPx++;
        }
        const ratio = matchPx / (totalPx || 1);
        if (ratio > bestScore) bestScore = ratio;
      }
      const confidence = Math.min(99, Math.round(bestScore * 140));
      return { checked: true, verified: confidence >= 35, confidence };
    } catch (e) {
      return { checked: false, verified: false, confidence: 0 };
    }
  }


  function compressImage(dataUrl, maxWidth = 800, quality = 0.82) {
    return new Promise(res => {
      if (!dataUrl || typeof document === 'undefined') return res(dataUrl);
      const img = new Image();
      img.onload = () => {
        const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
        if (W <= maxWidth && dataUrl.length < 180000) return res(dataUrl);
        const scale = Math.min(1, maxWidth / (W || maxWidth));
        const cw = Math.max(1, Math.round(W * scale)), ch = Math.max(1, Math.round(H * scale));
        const c = document.createElement('canvas'); c.width = cw; c.height = ch;
        c.getContext('2d').drawImage(img, 0, 0, cw, ch);
        res(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => res(dataUrl);
      img.src = dataUrl;
    });
  }


  function generateBrandAsset(title = 'NovaTech X1', subtitle = '2-Year Warranty · ₹24,999', bg = '#1E3A5F', accent = '#0D9488') {
    if (typeof document === 'undefined') return '';
    const c = document.createElement('canvas');
    c.width = 640; c.height = 360;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = accent;
    ctx.fillRect(36, 36, 120, 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('NOVATECH', 52, 60);
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(title, 36, 175);
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '500 22px system-ui, sans-serif';
    ctx.fillText(subtitle, 36, 225);
    ctx.fillStyle = accent;
    ctx.fillRect(36, 270, 220, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('OFFICIAL BRAND ASSET', 50, 298);
    return c.toDataURL('image/png');
  }

  function loadImage(dataUrl) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error('Could not decode uploaded image.'));
      img.src = dataUrl;
    });
  }

  async function analyseImage(dataUrl, knowledge, opts = {}) {
    if (!dataUrl) return { findings: [], meta: null };
    const k = knowledge || {};
    const company = k.companyName || 'the company';
    const approvedHex = (k.brandColors && k.brandColors.length) ? k.brandColors : ['#1E3A5F', '#0D9488', '#F8FAFC'];
    const approvedRgbs = approvedHex.map(hexToRgb).filter(Boolean);
    const minContrast = Number(k.minContrast || 4.5);
    const altText = String(opts.altText || '').trim();
    const channel = opts.channel || 'Social Post';

    const img = await loadImage(dataUrl);
    const W = img.naturalWidth || img.width || 800;
    const H = img.naturalHeight || img.height || 420;

    // Sample on scaled canvas for fast <30ms analysis
    const sw = Math.min(160, W), sh = Math.max(1, Math.round(H * (sw / W)));
    const canvas = document.createElement('canvas');
    canvas.width = sw; canvas.height = sh;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, sw, sh);
    const data = ctx.getImageData(0, 0, sw, sh).data;

    // Quantize colors into 16x16x16 buckets
    const buckets = new Map();
    let borderSum = 0, borderCount = 0;
    const marginX = Math.max(1, Math.floor(sw * 0.06)), marginY = Math.max(1, Math.floor(sh * 0.06));
    let minLum = 1, maxLum = 0, darkestRgb = [0, 0, 0], brightestRgb = [255, 255, 255];

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const idx = (y * sw + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
        if (a < 128) continue;
        const qr = (r >> 4) << 4, qg = (g >> 4) << 4, qb = (b >> 4) << 4;
        const key = (qr << 16) | (qg << 8) | qb;
        const entry = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
        entry.count++; entry.r += r; entry.g += g; entry.b += b;
        buckets.set(key, entry);

        const lum = relLuminance([r, g, b]);
        if (lum < minLum) { minLum = lum; darkestRgb = [r, g, b]; }
        if (lum > maxLum) { maxLum = lum; brightestRgb = [r, g, b]; }

        if (x < marginX || x >= sw - marginX || y < marginY || y >= sh - marginY) {
          borderSum += lum; borderCount++;
        }
      }
    }

    const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count);
    const totalPixels = sorted.reduce((s, e) => s + e.count, 0) || 1;
    const dominantColors = sorted.slice(0, 4).map(e => {
      const rgb = [e.r / e.count, e.g / e.count, e.b / e.count];
      const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
      const minDelta = Math.min(...approvedRgbs.map(ar => deltaE(rgb, ar)));
      return { hex, rgb, share: Math.round((e.count / totalPixels) * 100), deltaE: Math.round(minDelta) };
    });

    // Check contrast between top 2 distinct dominant clusters (or foreground/background)
    let measuredContrast = contrastRatio(brightestRgb, darkestRgb);
    if (dominantColors.length >= 2) {
      const c1 = dominantColors[0].rgb, c2 = dominantColors[1].rgb;
      // If top 2 colors cover significant area, check their mutual contrast as primary text/bg indicator
      if (dominantColors[1].share >= 5) {
        measuredContrast = Math.min(measuredContrast, contrastRatio(c1, c2));
      }
    }
    measuredContrast = Math.round(measuredContrast * 100) / 100;

    // Aspect ratio & clear-space check
    const ratio = +(W / H).toFixed(2);
    const aspectLabel = Math.abs(ratio - 1.78) < 0.18 ? '16:9 Landscape' : Math.abs(ratio - 1.91) < 0.15 ? '1.91:1 Ad Banner' : Math.abs(ratio - 1) < 0.1 ? '1:1 Square' : Math.abs(ratio - 0.8) < 0.1 ? '4:5 Portrait' : `${W}×${H} (${ratio}:1)`;

    // Check border variance for logo/text crowding near edges
    let borderVar = 0;
    const borderMean = borderSum / (borderCount || 1);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        if (x < marginX || x >= sw - marginX || y < marginY || y >= sh - marginY) {
          const idx = (y * sw + x) * 4;
          const lum = relLuminance([data[idx], data[idx + 1], data[idx + 2]]);
          borderVar += (lum - borderMean) ** 2;
        }
      }
    }
    borderVar = borderVar / (borderCount || 1);
    const clearSpaceOk = borderVar < 0.045;

    const primaryHex = dominantColors[0] ? dominantColors[0].hex : '#FFFFFF';
    const altTextSuggestion = `${company} ${channel} promotional graphic (${aspectLabel}) featuring primary ${primaryHex} visual layout with campaign headline and product callout.`;

    const findings = [];
    // 1. Palette Drift (CIELAB)
    const primary = dominantColors[0];
    if (primary && primary.deltaE > 32) {
      findings.push({
        id: 'vis_palette_' + Math.random().toString(36).slice(2, 6),
        category: 'vision', group: 'violation', severity: 'high', status: 'confirmed_mismatch',
        excerpt: `Primary image color ${primary.hex} (${primary.share}% area, ΔE=${primary.deltaE})`,
        start: -1, end: -1,
        reason: `Dominant image color ${primary.hex} drifts significantly (CIELAB ΔE = ${primary.deltaE}) from ${company}’s approved brand palette (${approvedHex.join(', ')}).`,
        rule: 'Visual Brand Identity · Palette Compliance (CIELAB ΔE ≤ 32)',
        evidence: `Canvas pixel clustering detected ${primary.hex} covering ${primary.share}% of pixels.`,
        suggestion: `Adjust background or accent colors to match ${company}’s approved palette: ${approvedHex.join(', ')}.`,
        fix: null, decision: null
      });
    }

    // 2. WCAG 2.1 AA Contrast
    if (measuredContrast < minContrast) {
      findings.push({
        id: 'vis_contrast_' + Math.random().toString(36).slice(2, 6),
        category: 'vision', group: 'violation', severity: 'critical', status: 'confirmed_mismatch',
        excerpt: `Measured contrast ratio ${measuredContrast}:1 (WCAG AA requires ≥ ${minContrast}:1)`,
        start: -1, end: -1,
        reason: `Foreground-to-background contrast (${measuredContrast}:1) fails WCAG 2.1 AA accessibility threshold (${minContrast}:1), making overlaid text hard to read.`,
        rule: `Accessibility · WCAG 2.1 AA Text-over-Image Contrast (≥ ${minContrast}:1)`,
        evidence: `Luminance ratio between dominant surface and overlay colors is ${measuredContrast}:1.`,
        suggestion: 'Darken the background overlay or use high-contrast #FFFFFF / #0F172A typography.',
        fix: null, decision: null
      });
    }

    // 3. Logo Clear-Space Padding
    if (!clearSpaceOk) {
      findings.push({
        id: 'vis_clearspace_' + Math.random().toString(36).slice(2, 6),
        category: 'vision', group: 'tone', severity: 'medium', status: 'potential_issue',
        excerpt: `High visual activity detected inside outer 6% edge margin`,
        start: -1, end: -1,
        reason: 'Elements or logos appear too close to the outer frame edges, risking cropping on mobile feeds or violating logo clear-space padding.',
        rule: 'Visual Layout · Minimum 6% Clear-Space Padding',
        evidence: `Edge luminance variance (${borderVar.toFixed(3)}) indicates non-uniform graphics touching safe margins.`,
        suggestion: 'Add at least 6% breathing room / padding around logos and text near image borders.',
        fix: null, decision: null
      });
    }

    // 4. Missing Alt-Text
    if (!altText) {
      findings.push({
        id: 'vis_alt_' + Math.random().toString(36).slice(2, 6),
        category: 'vision', group: 'violation', severity: 'medium', status: 'confirmed_mismatch',
        excerpt: 'Missing image alt-text for screen readers',
        start: -1, end: -1,
        reason: `Image attachments for ${company} require descriptive alt-text for accessibility compliance.`,
        rule: 'Accessibility · Mandatory Screen-Reader Alt-Text',
        evidence: 'Alt-text field is empty.',
        suggestion: `Apply suggested alt-text: "${altTextSuggestion}"`,
        fix: { type: 'alt_text', text: altTextSuggestion }, decision: null
      });
    }

    const logoCheck = await verifyLogoInImage(canvas, k.brandLogo);
    if (logoCheck.checked && !logoCheck.verified) {
      findings.push({
        id: 'vis_logo_' + Math.random().toString(36).slice(2, 6),
        category: 'vision', group: 'violation', severity: 'high', status: 'confirmed_mismatch',
        excerpt: `Official ${company} logo not detected in banner`,
        start: -1, end: -1,
        reason: `The uploaded image does not match ${company}’s official uploaded logo signature (match confidence: ${logoCheck.confidence}%).`,
        rule: 'Visual Brand Identity · Official Company Logo Verification',
        evidence: `Scanned banner corners against ${company}’s uploaded official logo.`,
        suggestion: `Include ${company}’s official approved logo from Brand Assets with proper clear-space padding.`,
        fix: null, decision: null
      });
    }

    return {
      findings,
      meta: {
        width: W, height: H, aspectLabel,
        dominantColors, approvedColors: approvedHex,
        contrastRatio: measuredContrast, minContrast,
        clearSpaceOk, altText, altTextSuggestion,
        logoChecked: logoCheck.checked,
        logoVerified: logoCheck.verified,
        logoConfidence: logoCheck.confidence
      }
    };
  }

  function generateSampleBanner() {
    if (typeof document === 'undefined') return '';
    const c = document.createElement('canvas');
    c.width = 800; c.height = 420;
    const ctx = c.getContext('2d');
    // Intentional off-brand neon pink/magenta background (triggers CIELAB palette drift)
    const grad = ctx.createLinearGradient(0, 0, 800, 420);
    grad.addColorStop(0, '#EC4899');
    grad.addColorStop(1, '#F43F5E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 420);

    // Intentional low-contrast yellow text (triggers WCAG contrast warning)
    ctx.fillStyle = '#FDE047';
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.fillText('NOVATECH X1 FESTIVE SALE', 48, 170);
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.fillText('Lowest Price Guaranteed · Limited Offer', 48, 225);

    // Edge-touching badge (triggers clear-space check)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(670, 6, 124, 34);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('NOVATECH', 688, 28);

    return c.toDataURL('image/png');
  }

  root.BrandVision = { analyseImage, generateSampleBanner, generateSampleLogo, generateBrandAsset, compressImage, deltaE, contrastRatio };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.BrandVision;
})(typeof window !== 'undefined' ? window : globalThis);
