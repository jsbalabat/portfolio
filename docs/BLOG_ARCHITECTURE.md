# Blog Architecture & Implementation Spec

## Overview
Git-backed blog integrated directly into the portfolio repository using Keystatic CMS, Astro content collections, and Cloudflare Pages.

---

## 1. Routing & Layout Structure

### Hierarchy & Placement
- **Main Site (`/`)**: Blog links and preview section sit **below Projects** in visual hierarchy and navigation.
- **Back Navigation**: `/blog` and `/blog/[slug]` display a clear "← Back to Portfolio" button linking back to `/`.

### Routes
| Route | Access | Purpose |
|---|---|---|
| `/blog` | Public | Main blog listing showing published posts. Contains back button to main site. |
| `/blog/[slug]` | Public | Individual blog post view. |
| `/blog/admin` | Private | Redirects to `/keystatic` dashboard. |
| `/keystatic` | Private | Keystatic CMS dashboard for drafting, publishing, and image uploads. |
| `/api/keystatic/*`| Private | Keystatic GitHub API and session synchronization endpoints. |

### Footer Login Link
- Login trigger exists **only in the `/blog` footer** as a subtle link (`Admin` / `Login`).
- Main site footer and navigation do not expose blog admin links.

---

## 2. Cloudflare Zero Trust Access Configuration

To gate the admin CMS at Cloudflare's edge:

1. **Open Cloudflare Zero Trust Dashboard**:
   - Navigate to **Access** → **Applications** → **Add an application**.
   - Select **Self-hosted**.
2. **Application Settings**:
   - Application Name: `Marc Portfolio — Blog CMS`
   - Domain: `marcbalabat.tech`
   - Path 1: `keystatic*`
   - Path 2: `blog/admin*`
   - Path 3: `api/keystatic*`
3. **Policy Configuration**:
   - Policy Name: `Allow Site Owner`
   - Action: `Allow`
   - Include Rule: **Emails** → Add your personal authorized email address.
4. **Identity Providers**:
   - Use Google Workspace / Gmail or One-Time PIN (OTP) emailed to your address.
5. **Outcome**:
   - Unauthenticated visitors attempting to access `/blog/admin`, `/keystatic`, or `/api/keystatic` are challenged at the edge before any HTML, JavaScript, or Workers compute is served.

---

## 3. GitHub OAuth Setup (Production Mode)

For live commits directly from the browser on `marcbalabat.tech`:

1. In GitHub: **Settings** → **Developer Settings** → **OAuth Apps** → **New OAuth App**.
   - Application Name: `Marc Balabat Portfolio Blog`
   - Homepage URL: `https://marcbalabat.tech`
   - Authorization callback URL: `https://marcbalabat.tech/api/keystatic/github/oauth/callback`
2. In Cloudflare Pages Environment Variables:
   - `KEYSTATIC_GITHUB_CLIENT_ID`: Your GitHub OAuth Client ID
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`: Your GitHub OAuth Client Secret
   - `KEYSTATIC_SECRET`: A 32-character random string for session signing

---

## 4. Data & Storage Model

- **Content Schema**: Defined in [`src/content.config.ts`](file:///Users/marc/projects/portfolio/src/content.config.ts) directly below `projects`.
- **Markdown Storage**: `src/content/blog/**/*.md`
- **Image Storage**: `public/images/blog/` (committed directly to git via Keystatic).
- **Deployment Pipeline**: Git commits from Keystatic push directly to GitHub, automatically triggering Cloudflare Pages static build.
