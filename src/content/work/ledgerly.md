---
title: Ledgerly
tagline: A Flutter app that replaced Excel billing at six distribution companies and clears about 150 invoices a day.
role: Sole developer
timeline: Jun 2025 to Jul 2026, 11.5 months
stack:
  - Flutter
  - Dart
  - Firebase Cloud Functions
  - Firestore
  - Node.js
liveUrl: null
demoVideo: /media/ledgerly-demo.mp4
repoUrl: null
featured: true
order: 1
---

## The problem

Six companies were billing out of Excel.

That sentence sounds worse than it is. Excel is a fine invoicing system right up until two people open the same file, or a salesman is standing in a warehouse with no signal, or someone needs to know how many units are actually left. Then it stops being a system and becomes a set of files that disagree with each other.

The specific failure was inventory. A sales requisition would go out, the stock would leave the building, and the spreadsheet that said what remained was updated later, by hand, by whoever remembered. Reconciliation happened at the end of the month, and it happened by argument.

> **VERIFY:** how the first company found you, and what they were using before you asked. If there is a founding story here, it belongs in this section and nowhere else.

## What "done" meant

The bar was set by the thing being replaced, which makes it harder rather than easier. Excel never loses your work, never logs you out, and never tells you it cannot reach the server. A salesman on a delivery route has to be able to write a requisition with one bar of signal or none, and the document has to be correct when it lands.

So the criteria were: works offline, numbers documents without collisions, and never decrements the same stock twice.

Six companies adopted it. It clears about 150 invoices a day.

## What I built

One Flutter codebase, Android and iOS, on Firebase. Role-based access control, Excel import for the initial catalogue load, PDF output for the documents themselves, and an audit-log export for the people who have to answer for the numbers.

The interesting part is where the writes happen.

An early version did what most Firebase apps do: the client wrote the requisition straight to Firestore with an `.add()` call, and a separate function was supposed to adjust inventory afterwards. That design has a quiet failure built into it, and I will get to it below.

The current version has no client writes at all. Every requisition goes through a Cloud Function that holds the whole operation: it decrements stock, assigns the document number, evaluates the customer's credit standing, renders the PDF, and sends the email. Firestore rules lock the collection so the client physically cannot write to it, and the inventory field is server-write-only. The client's job is to describe what the user wants and to wait.

Underneath that sits an offline queue on encrypted local storage. If there is no connection, the requisition is held locally, the app stays usable, and a debounced listener on the connectivity stream flushes the queue the moment the device comes back. Reference data is warmed at startup so the catalogue is present before anyone needs it, and a cached session lets a user open the app and work without a round trip to the auth server.

## The hard part

Inventory never went down.

Not sometimes. Never. The atomic function that decremented stock existed, it was correct, it was tested, and it was not being called, because the requisition path still ran through the client-side `.add()` from the earlier design. The write succeeded, the document appeared, the salesman saw what he expected, and the stock count sat exactly where it had been. Nothing errored. That is the worst kind of bug: the system is confidently wrong and hands you no reason to look.

The fix was not to call the function. The fix was to make the old path impossible. Cloud Functions became the sole write path for inventory, document numbering, and approvals, and the Firestore rules were tightened until the client could not have taken the shortcut even by accident. A bug you can only fix by remembering to fix it is not fixed.

The second one was smaller and better hidden. Credit approval was auto-clearing requisitions that should have been held, and it looked like a logic error in the approval rules. It was not. The customer account number carried untrimmed whitespace, so the lookup key never matched the accounts-receivable record, the balance came back empty, and empty read as nothing owed. One trailing space, and a credit control system that approved everything. The callable now trims the key and reads the live receivable rather than a cached copy, and a requisition against an over-limit account comes back marked for approval the way it always should have.

Both of these came from the same root: trusting that a value was what it appeared to be.

## Results

- Adopted by six companies, replacing Excel billing at each
- Clears about 150 invoices a day
- 139 commits over 11.5 months, sole developer
- Dart is 75.9% of the codebase
- Inventory decrements are atomic and idempotent, keyed on a client-generated identifier, so a retry from a flaky connection cannot double-count
- Document numbers are assigned server-side, so two salesmen writing offline at the same time cannot collide

> **VERIFY:** anything measurable from the customer side. Time to produce an invoice before and after, month-end reconciliation time, number of billing disputes. One before-and-after number here is worth more than everything above it.

## What I would do differently

I would put the writes on the server on day one. The client-write design was faster to build and it cost more than it saved, and every hard problem in the last six months of this project was a consequence of undoing it. Server-authoritative from the start is more work in week one and less work in every week after.

I would also have written the offline queue before the features that depend on it, rather than retrofitting it around them.
