---
title: UnitKo
tagline: Fourteen months on a rental platform, most of it spent on the schema rather than the screens.
role: Sole engineer
timeline: Jun 2025 to present, 14 months
stack:
  - Next.js
  - TypeScript
  - PostgreSQL
  - Supabase
  - Turborepo
  - Docker Compose
liveUrl: https://unitko.vercel.app
repoUrl: https://github.com/jsbalabat/unit-ko
featured: true
order: 2
---

## The problem

UnitKo has no users yet.

I am putting that first because the rest of this only makes sense once you know what you are reading: fourteen months of solo work on a rental platform that is deployed and not launched, with prospective landlords lined up and no live tenancies behind it. If you are looking for adoption numbers, they are in the Ledgerly case study, not this one.

What this project has instead is a schema I rewrote, and the two bugs that made me rewrite it.

Rental management is bookkeeping with names attached. A property has units, a unit has residents, a resident has a lease, a lease generates charges, and charges get paid, sometimes late, sometimes partially, sometimes three months at once in a single transfer. Every one of those relationships is a place where the data model either helps you or quietly lies to you.

Mine lied to me twice, and both lies were the same shape.

## What "done" meant

One guarantee, set at the start and never negotiated: a landlord sees their own data and nothing else, and that has to hold without any developer remembering to write a filter.

Everything below follows from taking that seriously.

## What I built

The first version was a Next.js application talking straight to Supabase, which is the fastest way to get a working product and the fastest way to end up with a codebase you cannot reason about. By month four it was one application holding the UI, the API surface, the types, and the schema, with no boundaries between them.

I split it into a Turborepo and pnpm workspace: web, API, shared types, and database.

The shared-types package pays for the migration on its own. Types generate from the schema, every other package imports them, and renaming a column breaks the build in the web app and the API in the same run instead of surfacing as a null three weeks later.

Then I moved the rules down into PostgreSQL, which is where most of the engineering in this project lives.

Almost a quarter of the codebase is PL/pgSQL. Row-level security policies scope every table by landlord, so a query that forgets its filter returns an empty set rather than someone else's tenants. Anything touching more than one table is an atomic RPC function rather than a sequence of client calls, because a lease and its payment schedule are one fact and should fail as one fact. Migrations are versioned, checked in, and applied in order. The schema is normalized to third normal form, and the whole thing runs under Docker Compose so the database a feature was written against is the database it gets tested against.

That normalization was not a tidiness exercise. It was a bug fix.

## The hard part

### The residents lived inside a column

Before the rewrite, the other residents of a unit were stored as an array of objects on the unit row. One column, holding a list of people.

It reads fine. It demos fine. It is also a first normal form violation, and every consequence of that arrived one at a time over about two months.

You cannot point at a resident, because a resident inside an array has no identity for anything else to reference. You cannot constrain one, because the database sees a blob and not a person. Changing a single resident means reading the array, editing it in memory, and writing the whole thing back, which is a read-modify-write that races with any other write to the same unit. And querying in the useful direction, from a person to the unit they live in, means scanning rather than looking up.

What I actually saw was inconsistency. The same resident data came back differently depending on which call had fetched it and what had touched the unit in between, and there was no single place to go and fix that, because the data had no single place to live.

The part that connects it to the access rules is the part I did not see coming. **Row-level security can only protect things that are rows.** A policy is evaluated per row, so if residents are elements inside a unit row, there is no granularity to enforce: you can grant or deny the whole unit and nothing narrower. The isolation guarantee I had made in the design was not implementable against the shape I had stored the data in.

Normalizing to third normal form gave every resident a row, an identifier, real foreign keys, and a policy of its own. The consistency bugs went away as a side effect. That was the point at which the schema stopped being a place to put data and started being the thing enforcing the rules.

### The payment waterfall lost money

The second one was worse, because it involved money.

Payments are allocated across outstanding charges in priority order, oldest first. That is the waterfall. It works cleanly when the payment is smaller than what is owed, and the interesting cases are all the other ones: an overpayment, a payment covering three months at once, a payment arriving before the charge it belongs to.

The original waterfall had no answer for the excess. Once the charges were satisfied, the remainder had nowhere to go, and money that had nowhere to go did not sit in an error, it just stopped appearing. Funds went missing on the dashboard. Worse, the same tenant's history read differently depending on which month you were looking at it from, because the allocation was being derived at read time rather than recorded when it happened.

> **VERIFY, and do this before publishing:** you said you think this is fixed. Confirm it, then describe the fix in two sentences. The questions to answer are: where does excess money live now (a credit balance, an unapplied-funds record, a negative charge), and is an allocation stored as its own record linking a payment to a charge with an amount, or still computed on read? Someone will click through to the live app, so the case study cannot be more confident than the code is.

The lesson underneath both bugs is the same one. In each case something real, a person and a payment allocation, had been left implicit inside another record instead of being given a row of its own, and in each case the symptom was inconsistency rather than an error. Nothing crashed. The data just quietly disagreed with itself depending on how you asked.

## Results

- 423 commits over 14 months, sole engineer
- TypeScript 76.9% of the codebase, PL/pgSQL 22.5%
- A monolith migrated to four packages, no rewrite and no downtime
- Per-landlord isolation enforced by the database rather than by application code
- Deployed at [unitko.vercel.app](https://unitko.vercel.app). Pre-launch, with prospective landlords in the pipeline

## What I would do differently

I would have found a landlord in month two.

Fourteen months is a long time to build without anyone using it, and both of the bugs above are the kind that a single real tenancy would have surfaced in a week. The engineering is the part of this project I would defend; the sequencing is not. Design the schema first and get one real user onto it second, before the feature list gets long enough to make the schema expensive to change.
