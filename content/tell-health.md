---
title: TellHealth
tagline: A telehealth platform built in six days, with an LLM that routes symptoms to the right specialist and knows when to stop routing.
role: Sole engineer on the sprint build
timeline: May 2026, 6 days
stack:
  - React 19
  - TypeScript
  - Node.js 22
  - MongoDB Atlas
  - Socket.IO
  - Docker Compose
  - Traefik
liveUrl: https://tell-health.vercel.app
repoUrl: https://github.com/jsbalabat/tell-health
featured: true
order: 3
---

## The problem

Whitecloak took 58 applicants and kept 25. The sprint was six days, the brief was a working telehealth platform, and the deliverable was a deployed application rather than a repository.

Booking a doctor requires you to already know which kind of doctor you need. Most people do not. They know they have had a headache for four days and that one side of their face feels wrong, and the specialist directory is no help at all, because it is organised by the answer rather than the question.

## What "done" meant

Deployed and usable by a stranger, in six days, with no team.

Not a demo path. Someone had to be able to describe a symptom, get matched to a specialist, book a consultation, and join a video call at the right time, and every one of those had to work when the judges tried it themselves.

## What I built

TypeScript from the database to the browser. React 19 on the front, Node.js 22 behind it, MongoDB Atlas underneath, the whole thing on Docker Compose behind Traefik so that TLS and routing were configuration rather than code.

Symptom matching runs on Groq's Llama 3.3 70B. A patient describes what is wrong in their own words, and the model returns a specialty, which is a translation problem rather than a diagnosis problem. The prompt is built to keep it that way: it maps language to a directory, and it is given no room to suggest what the patient has.

Consultations are real appointments, so the video call is time gated. The room does not exist before the slot and stops accepting joins after it, which closes the obvious hole where a booking becomes a permanent open line to a doctor.

Notifications run over Socket.IO with JWT authentication on the socket connection itself rather than on the handshake alone. A patient gets told their appointment was confirmed, and only that patient does.

89 commits in six calendar days. 44 of them landed on 30 May.

## The hard part

The model had to know when to stop being helpful.

Symptom matching is a pleasant problem until someone types chest pain and shortness of breath, and then routing them to a cardiologist with an appointment slot three days out is the wrong output in a way that matters. The system needed a path that was not "book a specialist," and an LLM asked to choose a specialty will always choose a specialty, because that is the question you asked it.

So red flags are handled before the routing question is asked, not inside it. A defined set of presentations short circuits the matching and returns an emergency response instead of a booking flow. The model is not trusted to recognise an emergency and then override its own instructions, because that is a single point of failure made of text.

> **VERIFY:** how the red flags are actually detected. A keyword and phrase list evaluated before the model call, a separate classification call, or a structured field the model must return first? Say which, in one sentence, and say why you chose it over the other two. An engineer will read this paragraph specifically to find out whether you understood the failure mode or got lucky.

The second constraint was the six days. Every decision in this build has a schedule attached to it, and pretending otherwise would be dishonest. Traefik instead of hand-written nginx configuration, MongoDB instead of a schema I would have to migrate twice, Groq instead of self-hosting anything. The interesting question in a six-day build is not what you would build with more time, it is which corners are safe to cut. Auth, the emergency path, and the time gating on the video rooms were the three I would not cut.

## Results

- Deployed and working at the end of the sprint, at [tell-health.vercel.app](https://tell-health.vercel.app)
- 89 commits across 6 calendar days, peaking at 44 in one day
- Selected as 1 of 25 from 58 applicants, then advanced to Round 2 to deliver tickets inside Whitecloak's own codebase
- End-to-end TypeScript, containerized, with TLS termination and routing handled by Traefik

## What I would do differently

I would write the red-flag path first. It was built after the matching worked, which meant the matching had to be taken apart and re-sequenced to make room for it, and the ordering of those two things is the entire safety property of the feature.

I would also containerize on day one rather than day four. Every hour spent on Docker Compose while the application already existed was an hour of reconciling two environments instead of one.
