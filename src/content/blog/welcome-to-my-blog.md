---
title: "Welcome to My Technical Blog"
description: "A look into how this blog is built directly into my portfolio using a Git-backed CMS without external databases."
publishedAt: 2026-10-15
tags:
  - "architecture"
  - "astro"
  - "web-dev"
coverImage: "/images/blog/welcome-cover.svg"
coverImageAlt: "Git-backed CMS architecture with Astro and Keystatic"
featured: true
draft: false
---

# Welcome to My Blog

I wanted a personal blog where I could write notes, post technical walkthroughs, and upload architecture diagrams without leaving my portfolio's design system or paying for external hosted databases.

## Why Git-Backed?

Instead of maintaining a separate server, database, and authentication layer, this blog uses a Git-backed workflow powered by Astro content collections and Keystatic.

* **Markdown-first**: Posts live right in the repository under `src/content/blog/`.
* **Instant static speed**: Cloudflare Pages serves pre-rendered HTML and optimized assets across the global edge.
* **Minimal overhead**: Zero monthly database bills and zero server patching.

Stay tuned for more case studies and engineering deep dives.
