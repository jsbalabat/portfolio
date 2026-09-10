# Phase 5: The Admin Dashboard

**Goal:** a private `/admin` page where you log in and see who is reading your portfolio, from
where, and for how long.

**Prerequisites:** Phase 4 complete, with real rows in D1. Let it run for a few days first so you
have something to look at other than your own test visits.

**Time:** 4 to 6 hours.

---

## Step 1: Gate it with Cloudflare Access

**Intent.** Put an identity check in front of `/admin` without writing or maintaining auth code.

**Why not hand-rolled auth.** Sessions, password hashing, timing-safe comparison, cookie flags,
CSRF, rate limiting, and rotation, all written and maintained by you, on a public internet-facing
route, for a page that exactly one person will ever open. That is a permanent attack surface bought
in exchange for a skill demonstration nobody will see, because the page is private. If you want to
demonstrate auth, demonstrate it somewhere a reviewer can actually look at the code.

Cloudflare Access is free for up to 50 users and sits at the edge, so an unauthenticated request
never reaches your Worker at all.

**Setup**, in the Cloudflare Zero Trust dashboard:

1. Access, Applications, Add an application, Self-hosted.
2. Domain `yourdomain.com`, path `admin`.
3. Policy: Allow, include Emails, and list your own address.
4. Identity provider: Google, or the built-in one-time PIN if you want zero configuration.

Match `/admin` and everything under it, including the API routes the dashboard calls. A gated page
that fetches from an ungated `/api/stats` is a gate that does nothing.

**Verify:** open `/admin` in a private window. You get Cloudflare's login screen. Log in, and you
reach the page. Then hit your stats API directly in that private window and confirm it is also
blocked.

**Belt and braces.** Access adds a `Cf-Access-Authenticated-User-Email` header to requests it lets
through. Check it in the route and return 404 if it is missing or is not your address. Cheap, and it
means a misconfigured Access policy fails closed instead of open.

**Failure mode.** Gating `/admin` and forgetting `/api/stats`. Test it explicitly.

---

## Step 2: Server-render it

`/admin` gets `export const prerender = false`, queries D1 during the request, and renders HTML.

This page has no performance constraint, no SEO requirement, and one user. That frees you from
every tradeoff the rest of the site is built around. It does not need a client-side framework, a
data-fetching layer, or a loading state. Query, render, done.

Accept a `?days=` parameter for the range, defaulting to 30. Clamp it to a sane maximum so a
`?days=99999` cannot table-scan your database.

---

## Step 3: The queries

Six panels. Each is one SQL statement.

**Headline numbers.** Views, unique visitors, and average duration for the period, with the
previous period alongside so every number has a direction.

```sql
SELECT COUNT(*)                     AS views,
       COUNT(DISTINCT visitor_hash) AS visitors,
       AVG(duration_ms)             AS avg_ms
FROM page_views
WHERE ts >= ?;
```

`COUNT(DISTINCT visitor_hash)` is a per-day unique, because the salt rotates. Say "daily uniques"
on the page so you do not later misread your own chart.

**Views over time.** Group by day. Fill missing days with zero in code, not SQL, so the chart has no
gaps.

**Top pages**, with average duration per page. This is the panel that earns the whole phase.

```sql
SELECT path,
       COUNT(*)         AS views,
       AVG(duration_ms) AS avg_ms
FROM page_views
WHERE ts >= ?
GROUP BY path
ORDER BY views DESC
LIMIT 20;
```

**Locations.** Country, then city within country. A table beats a map: you will have a handful of
countries and a table is readable, sortable, and takes an hour less to build.

**Referrers**, grouped by the `referrer_source` bucket, with the raw hosts underneath. This tells
you whether LinkedIn, your GitHub profile, or job applications are actually sending traffic, which
is the one thing that should change what you do next.

**Devices.** Three rows. Mostly a sanity check that your mobile work was worth it.

**Failure mode.** Averaging `duration_ms` without excluding nulls and outliers. A tab left open
overnight is a 40,000,000ms row that destroys the average. Filter to `duration_ms BETWEEN 1000 AND
1800000` and use a median rather than a mean if the numbers still look absurd.

---

## Step 4: Dwell time per case study

**Intent.** This is the metric you actually want, so build it deliberately rather than letting it
be a column in the pages table.

Views tell you someone landed. Dwell time on `/work/unitko` tells you a recruiter **read** it. That
is the closest thing you have to a signal about whether the writing from Phase 0 works.

A dedicated panel: one row per case study, showing views, median duration, and a bounce proxy (the
share of views under 10 seconds).

Rough calibration, once you have data: under 30 seconds means the opening did not hold them. Two
minutes or more means they read it. Track it after you change a case study's opening paragraph and
you have a genuine feedback loop, which almost no portfolio has.

---

## Step 5: Charts

**Server-render inline SVG.** Zero dependencies, no client JavaScript, works with the page, and it
is nice craft. A line chart is a `<polyline>` whose points you compute in the template. A bar chart
is a loop of `<rect>`.

Three charts is the whole dashboard: views over time, top pages as horizontal bars, countries as
horizontal bars.

Rules that keep them readable:

- Label the axes. An unlabelled chart is decoration.
- Show the number next to each bar. You will read the numbers, not measure the bars.
- Use your Phase 1 tokens so it matches the site, and check it in both colour themes.
- Give any wide table or chart its own `overflow-x: auto` container so the page body never scrolls
  sideways.

Promote a chart to a React island only when you specifically want hover or filtering, and only that
chart.

---

## Step 6: Operational bits

- **A "last 7 / 30 / 90 days" switch.** Plain links with a `?days=` parameter. No JavaScript.
- **A raw recent-views table**, last 50 rows. Genuinely the most useful panel in the first week,
  because it is how you notice the pipeline is wrong.
- **A retention policy.** Delete rows older than 12 months on a Workers Cron Trigger. Keeps you
  inside the free tier and is the honest implementation of the privacy page.
- **Do not add alerting.** You will check this page when you check it.

---

## Exit criteria

- [ ] `/admin` behind Cloudflare Access, verified in a private window
- [ ] The stats API is gated too, verified separately
- [ ] A defensive check on `Cf-Access-Authenticated-User-Email` in the route
- [ ] Six panels rendering from D1, all server-side
- [ ] A dedicated per-case-study dwell time panel
- [ ] Duration outliers excluded from every average
- [ ] Three inline SVG charts, labelled, readable in both themes
- [ ] Date range switch works and the `days` parameter is clamped
- [ ] Retention cron deleting rows older than 12 months
- [ ] No horizontal scroll on the page body at 390px wide

**The test for this phase:** visit your own site from your phone on mobile data, then open `/admin`
on your laptop and find that visit, with the right country and the right duration, within a minute.
