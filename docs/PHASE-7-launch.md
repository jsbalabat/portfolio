# Phase 7: Launch and Iterate

**Goal:** the site is live, the URL is everywhere it should be, and you have a loop for keeping it
true.

**Prerequisites:** Phase 6 complete.

**Time:** 2 hours to launch. The iteration loop is permanent.

---

## Step 1: Pre-launch checklist

Go through this in one sitting, on the deployed site, not locally.

**Content**
- [ ] No placeholder text anywhere. Search the built output for "lorem", "TODO", "coming soon"
- [ ] No "under construction" section. An empty section is worse than an absent one
- [ ] Every number traceable to `resume_master.json` or the GitHub audit
- [ ] No em dashes, no banned words from the resume standard
- [ ] Nothing about MyThorneAI anywhere, including image filenames and alt text
- [ ] No real customer names, emails, or company data visible in any screenshot
- [ ] Project names match the resume, the GitHub repos, and LinkedIn

**Function**
- [ ] Every link clicked, including the footer and the ones inside case study prose
- [ ] Resume PDF downloads and is the current version
- [ ] `mailto:` opens with the right address
- [ ] 404 works on a genuinely wrong URL
- [ ] Site works with JavaScript disabled. All content readable, navigation functional

**Presentation**
- [ ] Paste the URL into LinkedIn's composer. Correct image, title, description
- [ ] Paste it into Slack and into a WhatsApp message. Both previews correct
- [ ] Favicon shows in a browser tab, and looks right at 16px
- [ ] Both colour themes deliberate on every page
- [ ] Checked on mobile Safari and mobile Chrome

**Analytics**
- [ ] Your own visits excluded
- [ ] Bots filtered
- [ ] `/admin` gated, verified in a private window
- [ ] `/privacy` describes what the code actually does

---

## Step 2: Distribute the URL

A portfolio nobody visits is a hobby. Put it in these six places on launch day.

1. **LinkedIn.** Add it to the Featured section as a link with a real description, put it in the
   Contact Info website field, and reference it in your About section. The Featured section is the
   one that actually gets clicked.
2. **GitHub profile README.** The first line. Also add the URL to your GitHub profile's website
   field and to each of the three project repositories' About fields, so someone who lands on
   `unit-ko` from a search can find the case study explaining it.
3. **Email signature.**
4. **Job applications.** Most application forms have a portfolio or website field. Filling it in is
   the highest-intent traffic you will ever get.
5. **Your resume.** See Step 3, this one is a real decision.
6. **A launch post.** Optional, and worth doing on LinkedIn. Not "I built a portfolio". Post the
   most interesting thing in it: the offline-first invoicing architecture, or shipping a telehealth
   platform in six days. Link the case study, not the home page.

Then check `/admin` the next day and see which of these actually sent anyone. That is the reason
you built the referrer panel.

---

## Step 3: The resume decision

**This is a real tradeoff, not a formality.**

The `contact` field in `D:\Projects\Resumes\resume_master.json` currently holds email, phone,
LinkedIn, and GitHub. It is length-budgeted to stay under the 110-character wrap point at 9.5pt,
and that budget is worth a whole line of body text on a resume already sitting at about 97% of one
page. Adding a site URL costs characters you do not have.

Three options:

1. **Replace GitHub with the site.** The site links to GitHub anyway, and it is a better first
   destination because it frames the work rather than dumping repositories. This is the strongest
   option and it costs nothing in length.
2. **Add the site and drop the phone number.** Most remote international recruiters email first.
3. **Add nothing.** The site is on LinkedIn, which is on the resume.

Option 1, most likely. Whichever you choose, it is a content change plus a re-render, and the render
has to come back clean:

```powershell
cd D:\Projects\Resumes
python render_resume.py --check --data resume_master.json --out "Balabat-Resume-YYYY-MM.docx"
```

You need all three lines: fit estimate under 100%, `0 error(s), 0 warning(s)`, and
`Page count: 1 of 1 allowed`. Then promote it to `Balabat-Resume.pdf` yourself, and re-copy it into
the site's `public/` folder, because the site now serves a stale copy.

Also update `resume_base.json` in `~/.claude/skills/modresume/` in the same pass, or `/modresume`
will keep tailoring from the old contact line.

---

## Step 4: The iteration loop

**After one week.** Open `/admin`. You are looking for three things:

- **Are people arriving at all**, and from where. If everything is direct traffic, the distribution
  step did not work and that is the problem to fix, not the design.
- **Does anyone reach the case studies**, or do they land on the home page and leave? If they leave,
  the work cards are not earning the click. Rewrite the card copy, which is a one-hour fix.
- **Dwell time on each case study.** Under 30 seconds means the opening paragraph did not hold
  them. Two minutes or more means they read it.

**After one month.** Compare dwell time across the three case studies. The gap tells you something
real about your own writing, and it is a feedback loop essentially no portfolio has. Rewrite the
weakest opening and watch the number move.

**Quarterly.** A calendar reminder, because this is the step everyone skips and it is what makes a
portfolio go stale:

- [ ] Is the resume PDF on the site the current one?
- [ ] Are the live demo links still up? Free-tier hosts sleep, expire, and change URLs. A dead demo
      link on a portfolio is worse than no link, because it is the one thing a recruiter clicked
- [ ] Are the commit counts and adoption numbers still accurate? UnitKo is ongoing, so 423 climbs
- [ ] Is the front page project still your best work?
- [ ] Does the About page still describe your current situation?

**When something changes.** New job, new flagship project, new specialism. Update the positioning
line first, because everything else follows from it.

---

## Step 5: What comes after launch

Only once the site has been live and stable for a few weeks, and roughly in this order of value:

1. **A fourth case study.** Hearth, the job scraper, or sheets-mcp as a "what I build for myself"
   piece. It shows range and personality, and the slot already exists in the content collection.
2. **Writing.** Not a blog with a posting schedule you will not keep. Two or three genuinely good
   technical posts, undated, on things you actually solved: the row-level security model in UnitKo,
   the offline-first write queue, what shipping a product in six days really involved. This is the
   single highest-value addition to a developer portfolio and the one most people never do.
3. **One showpiece interaction.** If you still want it after living with the restrained version, add
   one, as an island, measured against the Phase 6 targets before and after.
4. **An RSS feed**, if you do the writing.

**What not to add:** a testimonials section with one testimonial, a live GitHub contribution graph
(it is a liability the first quiet month), a visitor counter, a "currently listening to" widget, or
a chatbot of yourself.

---

## Exit criteria

- [ ] Full pre-launch checklist cleared on the deployed site
- [ ] URL in all six distribution places
- [ ] Resume decision made, re-rendered clean, and the PDF on the site is current
- [ ] `resume_base.json` in the modresume skill matches `resume_master.json`
- [ ] Quarterly review reminder in your calendar
- [ ] One week later: you opened `/admin` and read your own numbers

**The test:** search your own name in a private window a week after launch. Your site should be on
the first page, and the result should look like something you chose rather than something a crawler
guessed.
