# Phase 3: The Public Site

**Goal:** every public page built, with the content from Phase 0 in it, discoverable and
accessible.

**Prerequisites:** Phase 2 complete. Live domain, content collection, tokens wired in.

**Time:** the bulk of the build. 5 to 8 sessions.

---

## Why this phase exists

This is where the site becomes the thing a recruiter reads. Two principles govern every decision:

**Build accessibility in, do not bolt it on.** Retrofitting a11y in Phase 6 means rewriting
components. Writing semantic HTML the first time costs nothing.

**Deploy after each page.** You have CI now. Use it. A page that has been live for a week has been
looked at on other people's devices.

---

## Step 1: The base layout

**Intent.** One layout every page extends, holding the head, the skip link, the landmarks, the
nav, and the footer. Everything sitewide is fixed in one place.

What it needs:

- A **skip-to-content link** as the first focusable element. Visually hidden until focused. This is
  the single cheapest accessibility win and its absence is the first thing an audit flags.
- **Real landmarks:** `<header>`, `<nav>`, `<main id="main">`, `<footer>`. One `<main>` per page.
- A **props-driven head**: title, description, canonical URL, OG image, page type. Every page
  passes its own, none of them fall back to a sitewide default, because a shared meta description
  across six pages is the same as having none.
- `<html lang="en">`.

**Verify:** load a page, press Tab once. The skip link appears. Press Enter. Focus lands on the
content.

**Failure mode.** A `<div class="header">` instead of `<header>`. It looks identical and it removes
the page's structure for anyone navigating by landmark.

---

## Step 2: The home page

Five sections in this order. Nothing else.

### Hero

The positioning line from Phase 0, at the largest type on the site, above the fold, in real text.
Not in an image, not fading in, not typewriter-animated. This is your Largest Contentful Paint
element and it must render immediately.

Below it: one line of supporting context and a single primary call to action. One. Two competing
buttons halve the click rate on both.

### Selected work

Three cards, one per case study, read from the content collection. Bento grid: give the strongest
project a larger cell so the eye lands there first.

Each card carries the project name, one line on what it does, the outcome number, and three stack
tags. Not six. The card's job is to earn the click, not to be the case study.

**The whole card is the link.** Wrap it in a single `<a>` rather than putting a "Read more" link
inside it. Larger target, one tab stop instead of three, no nested interactive elements.

### Skills

High on the page, because the one question a recruiter answers in seven seconds is *does this
person use our stack*. Grouped exactly as `resume_master.json` groups them: Languages, Frontend,
Backend, Databases, Mobile and DevOps, AI and LLM. Same words, so a recruiter reading both sees the
same person.

Plain text in semantic groups. No skill bars, no percentage rings, no "React ●●●●○". Nobody
believes them, they are unreadable to a screen reader, and claiming 80% at React invites a question
you cannot answer.

### About strip

Three sentences and your face. Link to the full About page.

### Contact

Your email as visible text plus a `mailto:` link. Your LinkedIn and GitHub. That is the whole
section.

**Failure mode for the home page as a whole.** Adding a sixth section. Every reference site in your
Phase 1 sweep will have had fewer sections than you expected. That is the finding.

---

## Step 3: The case study template

One dynamic route, `src/pages/work/[slug].astro`, rendering all three from the collection.

Structure, in order:

1. **Title and tagline.**
2. **A metadata row:** role, timeline, stack, and the live link. Scannable, above the fold.
   A recruiter who reads only this row should still learn that you were the sole engineer for
   fourteen months.
3. **The live link as a primary button.** 84% of employers want to see a working application. Make
   it impossible to miss. For the invoicing platform, this is the demo video instead, labelled
   clearly as a private commercial deployment.
4. **Hero image.**
5. **The six content sections** from your Phase 0 template, rendered from Markdown.
6. **The architecture diagram**, inline in the UnitKo "hard part" section where it explains
   something, not floated at the bottom as decoration.
7. **Next project link.** Never end on a dead end. Someone who read to the bottom of one case study
   is the most likely person on your site to read a second one.

**Typography rules here, because this is the longest text on the site.** 60 to 75 character
measure. Generous line height, 1.6 or so. Real vertical rhythm between sections. If it looks like a
wall, it will not be read, and the writing you did in Phase 0 is wasted.

**Verify:** read one case study top to bottom on your phone. If you scroll past your own writing,
so will everyone else.

---

## Step 4: About and Uses

**About.** Longer narrative, your photo, a short timeline, and how to reach you. This page is where
someone who already likes your work goes to decide whether they like you. Write like a person.

On current employment: if you mention it at all, "currently interning as a software developer" with
no client, no product, no technical detail. The confidentiality clause covers all of it.

**Uses.** Editor, terminal, machine, languages, the tools you build with. It takes an hour, it is
genuinely fun to write, and developers read these pages. It is also the right home for your AI
tooling: Claude Code with custom skills and hooks, and how you actually use it.

Keep that claim separate from your commit counts, for the same reason the resume standard keeps
them apart. "423 commits, built with Claude Code" invites the reader to discount the 423. The case
studies say what was built. The Uses page says what you build with. Different pages, no
juxtaposition to misread.

---

## Step 5: Resume, 404, privacy

**Resume.** Serve one canonical PDF from `public/`, copied from
`D:\Projects\Resumes\Balabat-Resume.pdf`. Not a rebuilt HTML version, which would drift from the
real one within a month. Link it in the nav and in the footer.

Add a calendar reminder to re-copy it whenever you promote a new render, because a stale resume on
a live site is worse than no resume.

**404.** Say what happened and link back to the work. Cloudflare Workers serves your generated
`404.html` for unmatched static routes.

**Privacy.** A stub now, filled in Phase 4 once you know exactly what you store.

---

## Step 6: SEO and structured data

**Intent.** Someone searches your name. Your site is the first result, and the preview looks
deliberate.

- **Unique title and meta description per page.** Titles under 60 characters, descriptions 150 to
  160. Write them; do not generate them from the first paragraph.
- **Canonical URL** on every page, absolute, matching your apex-vs-www decision from Phase 2.
- **Open Graph and Twitter card tags.** `og:title`, `og:description`, `og:image`, `og:url`,
  `og:type`, `twitter:card` as `summary_large_image`.
- **OG images at 1200x630.** One sitewide default, plus a per-case-study image. Astro can generate
  these at build time from a template, which is the version worth doing: it means a new case study
  gets a correct image automatically instead of you opening Figma.
- **Sitemap** from the integration added in Phase 2. **`robots.txt`** in `public/`, referencing it.
- **JSON-LD `Person` schema** in the base layout: your name, job title, URL, and `sameAs` pointing
  at your GitHub and LinkedIn. This is what lets a search engine connect the three profiles into
  one entity, which is the entire goal when someone searches your name.

**Verify.** Deploy, then paste your URL into the LinkedIn post composer and into a Slack message.
Both render a preview with your image, title, and description. Also check Google's Rich Results Test
for the JSON-LD. Do this before Phase 7, because a broken preview on the day you announce the site
is not recoverable.

**Failure mode.** A relative `og:image` path. It must be absolute, including the scheme and domain,
or every scraper silently ignores it.

---

## Step 7: Accessibility pass

Not the full audit, that is Phase 6. These are the things that are expensive to fix later:

- **Heading order.** One `<h1>` per page, no level skipped. Headings describe structure; they are
  not a font-size picker.
- **Visible focus states** on every interactive element. If your reset removed the default outline
  and you did not replace it, the site is unusable by keyboard.
- **Alt text** on every image. Describe what it shows, not what it is: "UnitKo tenant dashboard
  showing three active leases", not "screenshot".
- **Contrast** at 4.5:1 for body text, both themes.
- **Images with explicit `width` and `height`** so nothing shifts as they load. This is an
  accessibility fix and a Cumulative Layout Shift fix at once.
- **The reduced-motion block** from your Phase 1 motion budget, present from your first transition.

**Verify:** unplug your mouse and use the site for two minutes. Every link reachable, focus always
visible, nothing trapped.

---

## Step 8: Images

Every image goes through `astro:assets`, never a raw `<img src="/foo.png">`.

- The `<Image />` component generates AVIF and WebP with fallbacks and sets dimensions for you.
- Set `loading="eager"` and `fetchpriority="high"` on the single hero image, and let everything
  else lazy-load. Getting this backwards is the most common self-inflicted Largest Contentful Paint
  wound.
- Videos: `preload="none"`, a poster image, and no autoplay. A 20MB autoplaying video is the fastest
  way to fail Core Web Vitals on mobile data.

---

## Exit criteria

- [ ] Home, three case studies, About, Uses, 404 all live
- [ ] Resume PDF served and linked
- [ ] Unique title, description, and canonical on every page
- [ ] OG images render correctly when pasted into LinkedIn and Slack
- [ ] JSON-LD `Person` schema validates
- [ ] `sitemap.xml` and `robots.txt` present
- [ ] Every page keyboard navigable with a working skip link and visible focus
- [ ] Every image through `astro:assets` with alt text and explicit dimensions
- [ ] Read one full case study on your phone without wanting to scroll past it

**The test for this phase:** send the URL to someone who does not know what you do and ask them,
without prompting, which project they would click first and why. Their answer tells you whether the
hierarchy works.
