# Phase 1: Design Direction

**Goal:** decide how the site looks and behaves, on paper and in one CSS file, before you build
components.

**Prerequisites:** Phase 0 complete. You need the real content, because layout decisions made
against lorem ipsum are always wrong by the width of your actual longest heading.

**Time:** 4 to 5 hours. Time-box the inspiration sweep hard, see Step 1.

---

## Why this phase exists

Two failures live here, and they pull in opposite directions.

The first is designing in code: opening a component file, styling it, and ending up with sixteen
slightly different greys and four font sizes that are all nearly 16px. The fix is deciding the
system once, in tokens, before any component exists.

The second is designing for the wrong reader. The research on this is blunt: trying to demonstrate
technical prowess through elaborate animation usually backfires, because over-engineered animation
and parallax tank Largest Contentful Paint, and roughly 93% of recruiter browsing happens on a
phone. Past three seconds, you are gone. There is a real nuance underneath that, though: if your
audience were other developers, showy work would be reasonable. Yours is recruiters, so structure
and speed win, and craft has to show up in restraint rather than in effects.

---

## Step 1: The inspiration sweep, time-boxed

**Intent.** Collect structural decisions from sites that already work. Not colours. Not animation.

**Set a timer for 45 minutes.** This is genuinely the point of the step. Without a limit this
becomes an afternoon and produces nothing you can act on.

Work through the galleries in [README.md](README.md#inspiration). For each site you stop on, write
exactly one line in a file called `references.md`:

```
brittanychiang.com  - the whole site is one page; nav is a scroll-spy, not a menu
godly.website/...   - case study opens with the result, before the screenshot
```

Stop at ten. Ten is enough to see the patterns and few enough that you can hold them in your head.

**What you are actually looking for.** Four specific questions, and write your answer to each:

1. **How does the home page open?** Big type and nothing else? A grid of work immediately? A photo?
2. **How is work presented?** Cards in a grid, a vertical list, a bento layout?
3. **What is the case study structure?** Where does the result appear relative to the screenshot?
4. **How much is left out?** Count the nav items. Count the sections. It will be fewer than you
   expect. This is the answer that matters most and the one everyone ignores.

**Failure mode.** Bookmarking forty sites and extracting zero decisions. Also: falling for a site
built by a five-person agency over six months and setting that as your bar for a two-week solo
build. Awwwards winners are a reference for direction, not a target for scope. Godly is the more
honest comparison for what you are making, which is why it is the one to spend your minutes on.

---

## Step 2: Decide the structure

**Intent.** Answer the layout questions now, in words, so Phase 3 is execution.

Write down your answer to each. There is a recommendation next to each one, based on your audience.

| Question | Options | Recommended for you |
| --- | --- | --- |
| Single page or multi page? | One scrolling page vs separate routes | **Multi page.** Case studies need their own URLs so you can link one directly in an application, and so you can measure dwell time per project in Phase 5. |
| Nav items? | 3 to 5 | **Four:** Work, About, Uses, Resume. No "Home" item, the logo does that. |
| Home page sections? | | **Five:** hero with positioning line, selected work (3 cards), skills block, a short about strip, contact. Nothing else. |
| Where does the skills block go? | | **High, above the fold or just below it.** The one question a recruiter answers in the first seven seconds is *does this person use our stack*. This is the same reasoning that puts Skills above Experience on your resume. |
| Work card layout? | Grid, list, bento | **Bento grid.** It is the current pattern, it gives each project a different visual weight so the strongest one reads first, and CSS Grid with subgrid does it natively with no library. |
| Contact method? | Form vs mailto | **A plain mailto link plus your email in text.** A form on a static site needs a backend, gets spammed, and recruiters usually want to paste your address into their ATS anyway. |
| Dark mode? | | **Yes, both themes, system-default.** It is table stakes now and it is a visible correctness detail: half-done dark mode is more noticeable than none. |

**Failure mode.** Adding a blog section you will never write in. An empty or three-months-stale
blog is worse than no blog. If you want one, it is Phase 8, after launch.

---

## Step 3: Build the token set

**Intent.** One file that defines every colour, size, and space on the site. Every component reads
from it. Nothing hardcodes a hex value.

Create `tokens.css` (it moves into the project in Phase 2, unchanged).

### Colour

Pick a neutral ramp and exactly one accent. Not two.

- **Neutrals:** 9 to 11 steps from near-white to near-black. Do not use pure `#000000` or
  `#ffffff` for large areas, they are harsh and they make everything look unconsidered.
- **Accent:** one hue, three steps (a base, a hover, a subtle background tint). Used for links,
  focus rings, and one or two emphasis moments per page. That is all.
- **Semantic names on top of the ramp:** `--color-bg`, `--color-surface`, `--color-text`,
  `--color-text-muted`, `--color-border`, `--color-accent`. Components reference these, never
  `--neutral-700` directly, so a theme swap changes one block instead of forty files.

**Structure it so dark mode cannot break.** Define the complete light palette on bare `:root`, then
redefine only the semantic tokens in a `prefers-color-scheme: dark` block. Never let a colour have
its only definition inside a media query, because that is exactly the bug that produces black text
on a black background for one set of users.

```css
:root {
  --color-bg: var(--neutral-50);
  --color-text: var(--neutral-900);
  /* every semantic token defined here, light values */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: var(--neutral-950);
    --color-text: var(--neutral-100);
    /* only the semantic tokens are redefined, same names */
  }
}
```

**Check contrast now, not in Phase 6.** 4.5:1 minimum for body text, 3:1 for large text and for
UI borders that carry meaning. Check it in both themes. Muted text on a tinted surface is where
this always fails.

### Type

- **Two families maximum.** One for headings, one for body, and it is entirely fine for that to be
  one family in two weights. Typewolf will tell you what a pairing you liked actually was.
- **A modular scale**, not arbitrary numbers. A ratio of 1.25 or 1.333 from a 16px base, six or
  seven steps.
- **Fluid sizing** with `clamp()` for headings so you are not writing three breakpoints per level.
- **Body text at 16px minimum.** Under that, iOS Safari zooms on input focus and mobile reading
  gets unpleasant.
- **Measure of 60 to 75 characters** for prose. Your case studies are the longest text on the site
  and this is the difference between them being read and being skimmed.

### Space

One scale, based on 4px or 8px, six or seven steps. Every margin and padding on the site comes from
it. This single constraint is most of what makes a hand-built site look designed rather than
assembled.

**Failure mode.** Building tokens you then bypass "just this once" in a component. The first bypass
is the end of the system. If a value is missing from the scale, add it to the scale.

---

## Step 4: Wireframe four pages

**Intent.** Paper, or a whiteboard, or Excalidraw. Grey boxes, no colour, no font choices, ten
minutes each.

1. **Home:** hero, work grid, skills, about strip, contact.
2. **Case study:** title, metadata row, hero image, the six content sections, next-project link.
3. **About:** photo, longer narrative, timeline, contact.
4. **Admin:** the dashboard from Phase 5. Sketch it now while you are in design mode, because in
   Phase 5 you will be in database mode and it will end up as four unstyled tables.

**Do the mobile width first.** Sketch at roughly 390px, then widen. Designing desktop-first and
squeezing down is how you end up with a work grid that becomes an unreadable single column of
crushed cards, and mobile is where your audience actually is.

**Failure mode.** Skipping the case study wireframe because "it is just an article". It is the page
that has to hold six sections, an image gallery, a video, a diagram, and a stack list without
turning into a wall.

---

## Step 5: Write the motion budget

**Intent.** Decide the limits now, in writing, so that in Phase 3 you are checking against a rule
instead of asking yourself whether one more animation would be cool.

Write these into `docs/motion-budget.md` or straight into `references.md`:

1. **CSS transforms and opacity only.** `transform` and `opacity` are the two properties the
   browser can animate on the compositor without recalculating layout. Animating `width`,
   `height`, `top`, or `margin` forces layout on every frame and is where jank comes from.
2. **No animation on anything above the fold that delays first paint.** Your Largest Contentful
   Paint element must not fade in. This is the single most common way a portfolio fails Core Web
   Vitals while looking fine to its author on a fast desktop.
3. **Under 300ms per transition.** Longer than that reads as slow rather than smooth.
4. **`prefers-reduced-motion` honoured from the first component**, not retrofitted. One global
   block that kills transitions and animations, written the day you write your first transition.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

5. **No animation library at launch.** No GSAP, no Framer Motion, no Three.js. CSS transitions and
   the native `ViewTransition` API cover everything on your list. If after launch you want one
   showpiece interaction, add it then, as an island, measured. Adding a library now costs you
   kilobytes on every page for effects you have not designed yet.
6. **Scroll-triggered reveals, if you use them at all: once, subtle, and never on the hero.**
   `IntersectionObserver` with a small translate and a fade. Content must be present and readable
   with JavaScript disabled, so the reveal is progressive enhancement, not a gate.

**Failure mode.** Every one of these rules exists because it is the exact thing that turns a fast
static site into a 4-second load. The bento grid, big type, and generous whitespace do all the
visual work you need. Motion is seasoning.

---

## Exit criteria

- [ ] `references.md` with ten one-line observations and answers to the four structural questions
- [ ] Every row in the Step 2 structure table answered
- [ ] `tokens.css` with a neutral ramp, one accent, semantic tokens, and a dark block that
      redefines only semantic names
- [ ] Contrast checked at 4.5:1 in both themes
- [ ] A type scale and a space scale, each a single source of truth
- [ ] Four wireframes, sketched mobile-width first
- [ ] A written motion budget you can be held to

**The test for this phase:** open `tokens.css` and try to answer "what colour is muted body text in
dark mode" in under five seconds. If you have to think, the system is not done.
