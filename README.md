# BrandLens — Enterprise AI Brand Governance Platform (Round 3 Final)

**Tagline**: Create • Verify • Govern • Stay On-Brand  
**Team**: Shadow Monarchs · Jhulelal Institute of Technology (JIT) · CodeTitans India 2026  
**Live App**: https://brandlenslive.netlify.app/  
**GitHub**: https://github.com/shivampatil1912/Brandlens-  

---

## 🚀 Quick Start (Clone & Run Locally)

No build tools, bundlers, or paid API keys are required to run BrandLens locally:

```bash
git clone https://github.com/shivampatil1912/Brandlens-.git
cd Brandlens-
# Option A: Python static server
python3 -m http.server 5500
# Option B: VS Code -> Right-click index.html -> "Open with Live Server"
```
Then open `http://localhost:5500` in your browser.

### Run Automated Tests
```bash
node tests/test_round3.js
```
Verifies deterministic rule matching (including Hinglish claims), CIELAB ΔE color distance, WCAG 2.1 AA contrast math, PII redaction, and multi-language translation dictionaries.

---

## 🔑 Judge Demo Accounts (1-Click Access)

Both demo accounts are accessible in 1 click via the **⚡ Demo Account** buttons on `index.html` (and pre-filled on `auth.html`), plus a **Switch to Creator / Company** toggle in the top bar:

| Portal | Demo Email | Password | Role / Workspace | Pre-Loaded Demo State |
|---|---|---|---|---|
| **Company Demo** | `novatech12@gmail.com` | `12345678` | **Nova Tech** (Admin) | Official Logo, 2 Brand Assets, Brand Rules, 4 Approved Facts, 3 Submissions (`#1`, `#2` Approved; `#3` Pending Review) |
| **Creator Demo** | `shivampatil123@gmail.com` | `12345678` | **Shivam Patil** (Creator) | 4 Total Posts (`#1`, `#2` Approved; `#3` Under Review; 1 AI-Checked Draft with Text + Vision findings) |

*(Tip: Click the eye icon inside any password field to reveal/hide the password. Append `?reset=1` to `index.html` to reset demo data at any time.)*

---

## ✨ Key Features & Round 3 Improvements Delivered

1. **Multimodal Vision & Image Accessibility Scanner (`js/vision.js`):**
   - **Official Logo Verification:** Companies upload their official logo and approved offer/product images under **Brand Knowledge → Brand Assets & Visuals**; creator banners are verified against the company logo.
   - **CIELAB Palette Compliance (ΔE):** Visual color pickers (no raw hex typing) + Canvas pixel clustering to detect off-brand color drift.
   - **WCAG 2.1 AA/AAA Contrast & Clear-Space:** Verifies text-over-image contrast (`≥ 4.5:1`), 6% edge clear-space padding, and 1-click automated Alt-Text generation with automatic image compression.
2. **Governance Insights & Guideline-Ambiguity Dashboard (`company/insights.html`):**
   - Live KPIs (Avg Compliance Score, Turnaround Time, False-Alarm Rate, Multimodal/PII counts).
   - **Violation Frequency Heatmap** (Channels × Rule Categories).
   - **Guideline Ambiguity Telemetry** scoring rules by creator dismissal and reviewer false-alarm rates.
3. **Hybrid Database & Responsible AI Trust Suite (`js/cloud.js`, `js/trust.js`):**
   - **Hybrid Persistence:** Zero-config transactional **IndexedDB (`BrandLensDB`)** + optional **BYOD External Cloud Database** connector in **Company Settings** (`supabase_schema.sql` included for 1-click PostgreSQL setup).
   - **Client-Side PII Shield:** Detects and masks emails, phone numbers, card numbers, PAN IDs, and API keys before analysis.
   - **Reviewer False-Alarm Loop & Audit Export:** Reviewers can mark false alarms on any finding; 1-click **Export CSV / Audit JSON** on `Insights`, `History`, and `Report`.
4. **India-First & Usability Upgrades (`js/checker.js`, `js/i18n.js`):**
   - **Hinglish Claim Detector:** Flags unverified Indian market hype (*"sabse sasta"*, *"100% pakka"*, *"ekdum free"*, etc.).
   - **Multi-Language UI:** Globe dropdown (`🌐 EN / हिन्दी / मराठी`) across Home, Auth, Company, and Creator portals.
   - **Creator Productivity:** `Fix All Safe Issues`, `Before vs After Score`, `Live Channel Preview`, `Use Company Asset`, `.txt/.md` draft import, Printable Verification Certificate on approved posts, and `Delete` for unsubmitted drafts.

---

## 📁 Project Structure

- `index.html` & `auth.html` — Landing page & dual-portal authentication
- `js/checker.js` — Sub-50ms deterministic text & Hinglish compliance engine
- `js/vision.js` — Canvas-based CIELAB palette, WCAG contrast, logo & alt-text scanner
- `js/trust.js` — Client-side PII Shield, BroadcastChannel sync, CSV/JSON audit exporter
- `js/cloud.js` — IndexedDB transactional store & BYOD cloud REST adapter (`supabase_schema.sql`)
- `js/i18n.js` — Lossless English / Hindi / Marathi UI translation engine
- `js/api.js` & `js/app.js` — Decoupled async service layer & shared shell/UI components
- `company/` — `dashboard.html`, `knowledge.html`, `requests.html`, `review.html`, `insights.html`, `history.html`, `settings.html`
- `creator/` — `dashboard.html`, `companies.html`, `company.html`, `studio.html`, `submissions.html`, `report.html`
- `tests/test_round3.js` — Automated unit test suite
