const assert = require('assert');
const BrandCheck = require('./round3_project/js/checker.js');
const BrandVision = require('./round3_project/js/vision.js');
const BrandTrust = require('./round3_project/js/trust.js');

// 1. Test BrandCheck
const res1 = BrandCheck.analyse('Our brand offers the most cheapest smartphones in India at the lowest price guaranteed!', {
  companyName: 'Nova Tech',
  terms: [],
  claims: [{ id: 'c1', phrase: 'lowest price guaranteed', safe: 'backed by 2-year warranty', severity: 'critical' }],
  disclaimers: [{ id: 'd1', text: '*T&C apply.', trigger: 'price', severity: 'high' }],
  facts: []
});
assert(res1.length >= 3, 'Expected at least 3 findings from BrandCheck');
assert(res1.some(f => f.category === 'grammar'), 'Expected double superlative grammar finding');
assert(res1.some(f => f.category === 'disclaimer'), 'Expected missing disclaimer finding');

// Score should exclude dismissed & false_alarm
const scoreAll = BrandCheck.score(res1);
res1[0].decision = 'false_alarm';
const scoreAfterFA = BrandCheck.score(res1);
assert(scoreAfterFA.value > scoreAll.value, 'False alarm finding must not penalize score');

// 2. Test BrandVision math (CIELAB Delta-E & WCAG Contrast)
const deSame = BrandVision.deltaE([30, 58, 95], [30, 58, 95]);
assert.strictEqual(Math.round(deSame), 0, 'Same color should have Delta-E = 0');
const deDiff = BrandVision.deltaE([236, 72, 153], [30, 58, 95]); // Neon pink vs Navy
assert(deDiff > 50, 'Neon pink vs Navy should have large CIELAB Delta-E > 50');

const crBW = BrandVision.contrastRatio([255, 255, 255], [0, 0, 0]);
assert(Math.abs(crBW - 21) < 0.05, 'Black/White contrast should be 21:1');
const crLow = BrandVision.contrastRatio([236, 72, 153], [253, 224, 71]); // Pink vs Yellow
assert(crLow < 4.5, 'Neon pink vs yellow text should fail WCAG 4.5:1');

// 3. Test BrandTrust PII Shield
const piiText = 'Contact rahul@test.com or +91 9876543210 with key sk-abcdef1234567890';
const scan = BrandTrust.scanPII(piiText);
assert.strictEqual(scan.hasPII, true);
assert.strictEqual(scan.count, 3);
const masked = BrandTrust.maskPII(piiText);
assert(!masked.maskedText.includes('rahul@test.com'));
assert(!masked.maskedText.includes('9876543210'));
assert(!masked.maskedText.includes('sk-abcdef1234567890'));
assert(masked.maskedText.includes('[REDACTED_EMAIL]'));
assert(masked.maskedText.includes('[REDACTED_PHONE]'));
assert(masked.maskedText.includes('[REDACTED_SECRET]'));


// 4. Test Hinglish Claim Detector & BrandI18n
const BrandI18n = require('./round3_project/js/i18n.js');
const hRes = BrandCheck.analyse('Hamara phone sabse sasta hai aur 100% pakka chalega!', { companyName: 'Nova Tech', terms: [], claims: [], disclaimers: [], facts: [] });
assert(hRes.some(f => f.excerpt.toLowerCase().includes('sabse sasta')), 'Expected Hinglish sabse sasta finding');
assert(hRes.some(f => f.excerpt.toLowerCase().includes('100% pakka')), 'Expected Hinglish 100% pakka finding');
assert(BrandI18n.PHRASES['Create confidently.'].hi && BrandI18n.PHRASES['Dashboard'].mr, 'Expected HI and MR translations');

console.log('ALL ROUND 3 UNIT TESTS PASSED SUCCESSFULLY!');
