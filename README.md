# BrandLens — AI Brand Governance Platform (Production Hackathon Edition)

**Tagline**: Create • Review • Approve • Stay On-Brand  
**Team**: Shadow Monarchs · We Code 2026 Code Titan Hackathon

---

## 🌐 How to Make This Website Live (Free & Instant)

You can deploy BrandLens live online in less than 60 seconds:

### ⚡ Method 1: Netlify (Drag & Drop — No Terminal Needed)
1. Go to [netlify.com](https://www.netlify.com/) and log in.
2. Go to the **Sites** tab.
3. Simply **drag and drop this extracted project folder** into Netlify!
4. Netlify will immediately publish your website with a live URL (e.g. `https://brandlens-demo.netlify.app`).

### ⚡ Method 2: Vercel / GitHub
- Push to GitHub or run `vercel` in terminal. Root `index.html` is automatically served.

### ⚡ Method 3: Run Locally on Your Laptop
1. Open this folder in **VS Code**.
2. Right-click `index.html` -> **Open with Live Server**.
3. Or in terminal:
   ```bash
   python3 -m http.server 5500
   ```
   Open `http://localhost:5500` in your web browser.

---

## 🔑 Demo Accounts for Judges

Both demo accounts are pre-loaded with rich, interconnected brand data and submissions:

| Portal | Demo Email | Password | Role / Entity | Pre-loaded Content |
|---|---|---|---|---|
| **Company Demo** | `novatech12@gmail.com` | `12345678` | **Nova Tech** (Admin) | 4 Brand Rules, 4 Approved Facts, Disclaimers, and 1 Pending Review Request |
| **Creator Demo** | `shivampatil123@gmail.com` | `12345678` | **Shivam Patil** (Creator) | 2 Approved Posts, 1 Active AI Review Post with 3 detected issues, 1 Pending Post |

*Password Toggle: Click the **eye icon** inside the password input to reveal or hide the password at any time.*

---

## 👤 New User Registration & Real Workspaces

BrandLens is not just a hardcoded demo. It also supports **real, functional new user workflows**:
- **New Company Registration**:
  - Sign up with a new company name and email.
  - Complete brand setup in **Brand Knowledge Centre**: add Brand Profile, Brand Voice, Approved Facts, Terminology, Claims & Policies, and Disclaimers.
  - Open workspace to creators!
- **New Creator Registration**:
  - Sign up with a new creator name and email.
  - Discover registered companies in **Find Companies**.
  - Write custom content in **Content Studio**, check it against brand rules in real-time, and submit for approval.

---

## 🧪 Recommended Judge Testing Walkthrough

1. **Homepage (`index.html`)**:
   - Clean hero section with side-by-side **⚡ Demo Account** and **Get Started** buttons for both Company and Creator cards.
2. **Creator Demo Flow**:
   - Click **⚡ Demo Account** under "For Creators" -> Click **Sign in**.
   - Notice the populated **Creator Dashboard**: 4 total posts, 2 approved posts, and 1 pending review.
   - Click **⚡ Open AI Check Demo Post** or open `#3 Festive Season Promotional Launch`:
     - Test prompt: *"Our brand offers the most cheapest smartphones in India. Everyone can get premium quality at the lowest price guaranteed!"*
     - View the **AI Review Report**:
       1. **Grammar Issue**: Flags `"most cheapest"` (double superlative). Click **Accept suggestion** -> rewrites to `"cheapest"`.
       2. **Comparative Claim**: Flags `"cheapest smartphones in India"`. Click **Accept suggestion** -> rewrites to `"affordable smartphones in India"`.
       3. **Absolute Guarantee**: Flags `"lowest price guaranteed"`. Click **Accept suggestion** -> rewrites to `"backed by our 2-year warranty"`.
     - Click **Submit for approval** -> The submission status changes to **Pending review**!
3. **Company Demo Flow**:
   - Log out and click **⚡ Demo Account** under "For Companies" -> Click **Sign in**.
   - In **Company Dashboard**, see the new pending review request in real-time.
   - Open **Review Requests** (`requests.html`) -> Click **Review** on the submission.
   - Inspect the submitted content side-by-side with the AI findings and creator details.
   - Click **Approve** (or **Request changes** / **Reject**) with reviewer comments.
4. **Verification**:
   - Log back into Creator Demo -> The post status is now updated to **Approved** with the company's feedback comment!
