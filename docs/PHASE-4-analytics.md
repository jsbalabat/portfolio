# Phase 4: The Analytics Pipeline

**Goal:** every page view lands in your own database, with country and city, and with no personal
data stored anywhere in it.

**Prerequisites:** Phase 3 complete and deployed. The site must be running on Cloudflare, because
the geolocation comes from the edge.

**Time:** 4 to 6 hours.

---

## Why build this instead of pasting a script tag

You asked for an admin pathway to see your own metrics. You could get most of it from a hosted
tool. Building it yourself buys three things a script tag does not:

- The data is in a database you control, so you can ask any question you want in SQL rather than
  the questions a dashboard offers.
- It is the part of this project that exercises backend skill. The rest of the site is a static
  document.
- You get one metric that hosted tools do not give you cleanly and that actually matters for your
  goal: **dwell time per case study**.

**Do this first, before anything else in this phase:** add Cloudflare Web Analytics to the site.
One script tag, free, ten minutes. It means you are collecting data while you build the real thing,
and you have a second source to sanity-check your own numbers against. Nothing is worse than
finishing your dashboard and finding it disagrees with reality with no way to tell which is wrong.

---

## Step 1: Design the privacy model first

**Intent.** Decide what you store before you write the code that stores it. Getting this backwards
means shipping a schema with an IP column and then rationalising it.

The rule: **never store a raw IP address and never store a raw user agent.** That is not caution,
it is the specific technical property that keeps the whole thing out of scope. If your analytics
never stores IP addresses and never builds a fingerprint that could identify an individual, most
legal readings conclude you are not processing personal data at all, which means no cookie banner
and no consent flow.

The pattern, which is what Plausible and Rybbit use:

```
visitor_hash = SHA-256(daily_salt + domain + ip + user_agent)
```

with the salt **rotated and deleted every 24 hours**. That gives you a stable identifier for one
visitor for one day, so "unique visitors today" is a real number, and makes cross-day tracking of
an individual impossible even for you, because yesterday's salt no longer exists.

What you store, and why each is safe:

| Field | Stored | Note |
| --- | --- | --- |
| Visitor hash | Yes | One-way, salted, unrecoverable after 24h |
| Path | Yes | Yours, not theirs |
| Referrer host | Yes | Host only. Strip the path and query, they can carry search terms and tokens |
| Country, city, region | Yes | City-level from Cloudflare is coarse, not a location |
| Device class | Yes | Three buckets: mobile, tablet, desktop. Derived, then the user agent is discarded |
| Timestamp | Yes | |
| Duration | Yes | |
| **IP address** | **Never** | Feeds the hash, is never written |
| **Full user agent** | **Never** | Feeds the hash and the device bucket, is never written |

**City is a judgment call.** Cloudflare gives it free and you asked for viewer locations. It is
coarse enough to be fine for a portfolio getting a few hundred visits. If it ever makes you uneasy,
drop the column: country plus region answers "is anyone in the US or Europe reading this", which is
the actual question.

---

## Step 2: Create the database

```powershell
npx wrangler d1 create portfolio-analytics
```

It prints a `d1_databases` block. Paste it into `wrangler.jsonc` with the binding named `DB`.

Write `schema.sql` at the project root:

```sql
CREATE TABLE IF NOT EXISTS page_views (
  id              TEXT PRIMARY KEY,
  ts              INTEGER NOT NULL,        -- unix ms
  path            TEXT    NOT NULL,
  referrer_host   TEXT,                    -- host only, never the full URL
  referrer_source TEXT,                    -- 'linkedin' | 'github' | 'search' | 'direct' | 'other'
  country         TEXT,
  region          TEXT,
  city            TEXT,
  device          TEXT,                    -- 'mobile' | 'tablet' | 'desktop'
  visitor_hash    TEXT    NOT NULL,
  duration_ms     INTEGER                  -- filled in by the leave beacon
);

CREATE INDEX IF NOT EXISTS idx_pv_ts      ON page_views(ts);
CREATE INDEX IF NOT EXISTS idx_pv_path_ts ON page_views(path, ts);
CREATE INDEX IF NOT EXISTS idx_pv_visitor ON page_views(visitor_hash, ts);

-- Salts are deliberately short-lived. Dropping the old row is what makes
-- yesterday's visitor hashes permanently unlinkable to today's.
CREATE TABLE IF NOT EXISTS daily_salt (
  day        TEXT PRIMARY KEY,             -- 'YYYY-MM-DD' UTC
  salt       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

Apply it locally, then remotely:

```powershell
npx wrangler d1 execute portfolio-analytics --local  --file=./schema.sql
npx wrangler d1 execute portfolio-analytics --remote --file=./schema.sql
```

**Verify:**

```powershell
npx wrangler d1 execute portfolio-analytics --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

**Failure mode.** Forgetting `--remote` and wondering why production has no tables. `--local` writes
to a SQLite file in `.wrangler/`; they are entirely separate databases. Keep both in step by always
running the pair.

---

## Step 3: The collection endpoint

Create `src/pages/api/collect.ts` with `export const prerender = false;`. That one line is what
makes this route render on demand while the rest of the site stays static.

### Reading geolocation

Cloudflare attaches it to the request. No GeoIP database to ship, no third-party lookup:

```ts
const cf = context.request.cf;
// cf.country, cf.city, cf.region, cf.timezone, cf.colo
```

The `cf-ipcountry` header carries the country on its own if you only want that. Check the adapter
docs for how the current version exposes `cf` and the D1 binding, since both moved recently: the
binding is reached with `import { env } from 'cloudflare:workers'` in the current adapter.

### The hash

```ts
async function visitorHash(salt: string, domain: string, ip: string, ua: string) {
  const input = new TextEncoder().encode(`${salt}|${domain}|${ip}|${ua}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

The IP comes from the `cf-connecting-ip` header. It is used here and discarded. It must never
reach a variable that gets written, logged, or included in an error message.

### The salt

Get or create today's salt on first request of the day, and delete anything older than two days in
the same pass. Two days rather than one so a request in flight across midnight cannot fail.

Generate it with `crypto.getRandomValues`, not `Math.random`.

### What the handler does

1. Reject anything that is not POST.
2. Reject bots by user agent (see Step 5).
3. Reject requests whose `origin` is not your domain, so your endpoint is not free storage for
   anyone who finds it.
4. Get today's salt, compute the hash.
5. Derive the device bucket from the user agent, then drop the user agent.
6. Reduce the referrer to its host, then classify it into a source.
7. Insert one row, always with bound parameters.
8. Return `204 No Content`. There is nothing to say and the browser is not waiting.

### Two things to get right

**Bound parameters, always.** `db.prepare('INSERT ... VALUES (?, ?, ?)').bind(a, b, c)`. Never
build SQL by string concatenation. The path and referrer come from the client and are attacker
controlled.

**Do the insert inside `waitUntil`.** The response returns immediately and the write completes
after. The visitor never waits on your database:

```ts
context.locals.cfContext.waitUntil(insertPromise);
```

**Failure mode.** Writing a row per request with no rate limiting. One curl loop fills your D1 free
tier. Cap it: a Cloudflare rate-limiting rule on `/api/collect`, or a per-hash insert cap in the
handler.

---

## Step 4: The client beacon

Small inline script in the base layout. Keep it inline: a separate file costs a request to save
under a kilobyte.

**On page load,** POST `{ path, referrer, screenWidth }` to `/api/collect` with
`navigator.sendBeacon`. `sendBeacon` is fire-and-forget, non-blocking, and survives the page being
closed, which `fetch` does not.

**For dwell time,** record `performance.now()` at load, then on `visibilitychange` to `hidden` send
a second beacon with the view id and the elapsed time. Use `visibilitychange`, not `beforeunload`:
`beforeunload` is unreliable on mobile Safari, which is a meaningful share of your traffic.

Guard the whole thing in a `try/catch` that does nothing on failure. Analytics must never be able
to break the page.

**Exclude yourself.** Visiting `yourdomain.com/?noanalytics=1` once writes a `localStorage` flag,
and the beacon checks it and returns early. Without this, your own testing is a large fraction of
your data and every number is wrong.

**Verify:** open the deployed site on your phone, then:

```powershell
npx wrangler d1 execute portfolio-analytics --remote --command "SELECT ts, path, country, city, device FROM page_views ORDER BY ts DESC LIMIT 5"
```

Your row is there with the right country and device. Then navigate away and confirm `duration_ms`
gets filled in.

---

## Step 5: Filter bots

Without this, most of your data is crawlers and your numbers mean nothing.

- **User agent matching** on the obvious set: `bot`, `crawler`, `spider`, `slurp`, `bingpreview`,
  `headlesschrome`, `lighthouse`, `pagespeed`, plus the LinkedIn, Slack, and Discord link
  unfurlers. Case-insensitive.
- **`navigator.webdriver`** true means automation. Skip the beacon.
- Cloudflare's bot score is a paid feature. The user agent list is enough at your traffic level.

Log nothing about the requests you reject. Just return 204 and move on.

---

## Step 6: The privacy page

Fill in the stub from Phase 3. Plain language, no legalese, and it is genuinely a credibility signal
to anyone technical who reads it. State:

- The site uses self-built analytics. No third-party trackers, no advertising, no cookies.
- What is stored: page, referring site, country and city, device type, timestamp.
- What is not: IP addresses, user agents, names, anything that identifies you.
- How the visitor identifier works: a one-way hash with a key that is destroyed every 24 hours,
  which makes it impossible to link a visitor across days.
- Where it lives: Cloudflare D1, readable only by you.
- How to opt out: append `?noanalytics=1` to any URL.

Making that last one real, and honouring it, is what makes the rest of the page true.

---

## Exit criteria

- [ ] Cloudflare Web Analytics was live from day one of this phase as a cross-check
- [ ] D1 database created and schema applied to both `--local` and `--remote`
- [ ] `POST /api/collect` writes a row, returns 204, and inserts inside `waitUntil`
- [ ] Country, region, city, and device populate correctly from a real phone visit
- [ ] No column anywhere holds a raw IP or a full user agent
- [ ] The salt rotates daily and old salts are deleted
- [ ] Bot traffic filtered; your own visits excluded via the opt-out flag
- [ ] Every query uses bound parameters
- [ ] Rate limiting on the endpoint
- [ ] `duration_ms` fills in when you navigate away
- [ ] `/privacy` describes exactly what the code does

**The test for this phase:** run `SELECT * FROM page_views LIMIT 20` and try to identify a specific
person from it. You should not be able to, and neither should anyone who gets a copy of the file.
