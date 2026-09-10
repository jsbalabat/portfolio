# Content notes

Not a page. Working notes for the case-study drafts in this folder. Keep it out of
`src/content/work/` when you move the files in Phase 2.

## Housekeeping

`invoicing.md` is superseded by `ledgerly.md`. Delete it:

```powershell
Remove-Item D:\Projects\portfolio\content\invoicing.md
```

## Project names (Phase 0, Step 2, closed)

| Project | Repo | Live URL | Public name | Still to do |
| --- | --- | --- | --- | --- |
| Rental property platform | `unit-ko` | unitko.vercel.app | **UnitKo** | Nothing. |
| Telehealth platform | `tell-health` | tell-health.vercel.app | **TellHealth** | Update the repo description. |
| Invoicing platform | `distribution-app` | none | **Ledgerly** | Rename the repo to `ledgerly`, update the resume, update LinkedIn. |

Ledgerly is the one that needs work outside this folder. It has been `distribution-app`,
`new_test_store`, and "Sales and Invoicing Platform", and the whole point of rule 5 is that a
reader can connect the resume line, the repo, and the case study. Rename the repository rather than
only its description, and change `resume_master.json` in the same sitting so the two never disagree.

The demo video path in the frontmatter is now `/media/ledgerly-demo.mp4`. Name the file to match
when you record it.

## One accuracy problem in the hero copy

The supporting line under the positioning statement currently reads "Sole engineer on three
production systems in 14 months." UnitKo has no users, so "production systems" overstates it by
one third, and it is the kind of claim that falls apart in an interview when someone asks who uses
UnitKo.

Two ways to fix it, both honest:

- "Sole engineer on three shipped products in 14 months." Shipped is defensible for a deployed
  application with no users, and it is the word your resume already uses.
- "Sole engineer on three products in 14 months, one of them in daily commercial use." Weaker
  rhythm, stronger claim, and it puts the emphasis where the evidence actually is.

The headline itself is unaffected. Six companies did stop billing out of Excel, and that is
Ledgerly.

## Writing rules applied to these drafts

From the article, plus the resume standard, which is stricter where they overlap.

- No hedge words. Not "arguably", "in many cases", "tends to", "can often", "it is worth noting".
  Where a qualifier was needed it is a specific one.
- One three-item list per 500 words at most. Everything else is two items, four, or a single claim.
- The phrase "not just" does not appear.
- Paragraph lengths are deliberately uneven. One-sentence paragraphs sit next to six-sentence ones.
  If you edit these, keep the unevenness; it is the tell that is hardest to fake back in.
- No closing summary paragraph. Every section ends on a concrete sentence rather than a recap. Do
  not add "In conclusion" or "Ultimately" anywhere.
- Zero em dashes and zero en dashes. The article allows one per 300 words; your resume standard
  allows none, so none.
- No vague authority claims.
- Banned words from the resume standard are absent: robust, seamless, comprehensive, leveraged,
  utilized, spearheaded, orchestrated, pivotal, intricate, delve, synergy.

Where the specificity rule needed a detail only you could supply and you had not supplied it, there
is a `> **VERIFY:**` block rather than an invention.

## Gaps to fill

Four `VERIFY` blocks left, down from nine. Roughly 25 minutes.

**Blocking. Do not publish UnitKo until this is answered.**

1. `unitko.md`, the payment waterfall. You said you think it is fixed. Confirm it, then answer two
   things in two sentences: where does excess money live now, and is an allocation stored as its own
   record linking a payment to a charge with an amount, or still computed at read time? The case
   study describes money going missing on a dashboard that is publicly reachable. It cannot sound
   more confident than the code is.

**Worth doing.**

2. `ledgerly.md`, results. One before-and-after from the customer side. Time to produce an invoice,
   month-end reconciliation time, billing disputes per month. You have the strongest adoption story
   of the three and no number describing what changed for the people using it.
3. `tell-health.md`, the hard part. How red flags are actually detected: a keyword and phrase list
   evaluated before the model call, a separate classification call, or a structured field the model
   must return first. One sentence on which, one on why not the others.
4. `ledgerly.md`, the problem. How the first company found you, and what they were doing before.

**Check rather than write.**

5. Both `repoUrl` values assume `github.com/jsbalabat/<repo>`. Confirm they are public and correct,
   and update the UnitKo one if you rename anything.
6. Record the Ledgerly demo video. It is the substitute for a live link on the only project without
   one, so it is required rather than optional.
7. Read `ledgerly.md` for anything a customer would recognise. The draft carries no company names or
   document numbers, but you know the domain better than I do. Same pass over every screenshot
   before it goes near the repo.

## Closed

- **UnitKo users.** There are none. The case study now says so in its first line and does not claim
  otherwise anywhere. This turned out better than hiding it: opening with the limitation buys enough
  credibility to spend on the engineering, and the engineering is genuinely the point of that project.
- **UnitKo hard part.** Replaced. The row-level security framing was mine and it was wrong; the real
  story is the array-of-objects column that violated first normal form and the payment waterfall that
  lost the excess. Those are better material, because both are things that happened rather than
  categories of thing that can happen.
  The line worth keeping in your head for interviews, because it is the bridge between the two halves
  of that project: **row-level security can only protect things that are rows.** Residents stored
  inside a unit row could not be given a policy of their own, so the isolation guarantee you designed
  was not implementable until the schema was normalized. That is a real technical argument and you
  can defend it.

## Ordering

`order` reads: Ledgerly, UnitKo, TellHealth.

Ledgerly is first because the positioning line points at it. A visitor who reads "six companies
stopped billing out of Excel because of software I wrote alone" and then meets UnitKo in the first
card has to go looking for what was promised.

UnitKo second is deliberate now that it opens by admitting it has no users. Second position is read
by people who are already engaged, and that is the audience for a case study whose value is entirely
in the schema work.

TellHealth third is not a demotion. It has the most external validation and the cleanest narrative,
and third position is where someone who is still reading arrives.

## Length

Ledgerly and TellHealth are 700 to 850 words. UnitKo is closer to 1,000 because the hard-part
section now carries two bugs instead of one, and it earns the extra 150 words. Resist growing any of
them further. If a section needs more room, something else in it is padding.
