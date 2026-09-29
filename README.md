# Portfolio

Personal portfolio and engineering case studies for **Marc** ([@jsbalabat](https://github.com/jsbalabat)), full-stack software engineer.

The site is built with **Astro 5** (static by default), **React 19** interactive islands, **Tailwind CSS 4** with CSS-first design tokens, **Three.js** / **React Three Fiber** for 3D interactive graphics, and is architected for deployment to **Cloudflare Workers** with edge-native **Cloudflare D1** SQLite database and **Cloudflare Access**.

## Architecture & Stack

- **Framework:** [Astro 5](https://astro.build) (content-driven, zero-JS baseline)
- **Interactive Islands:** [React 19](https://react.dev) + `@react-three/fiber` / [Three.js](https://threejs.org)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com) via `@theme` CSS custom properties
- **Deployment:** [Cloudflare Workers](https://developers.cloudflare.com/workers/) with static asset hosting
- **Database & Edge Analytics:** [Cloudflare D1](https://developers.cloudflare.com/d1/) with privacy-first daily salted hash telemetry (no raw IP storage)

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Type check
pnpm check

# Production build
pnpm build

# Preview edge worker runtime locally
npx wrangler dev
```

## Branch Strategy

- `staging`: Primary integration branch. All feature branches, tests, and CI verification run here first.
- `main`: Production release branch. Only thoroughly verified builds from `staging` are merged to `main`.

## Documentation

Full architectural specifications, design tokens, and phase-by-phase implementation guides are organized under [`docs/`](docs/).


## TODO

Add the following later.
- fix shifting in mobile view whenever scrolling up/down. area in landing page space adjusting whenever scrolling happens.
- make diff slider top bottom/sandwich comparison not side by side
- make animations smoother. example, transition animation when pressing explore is not smooth and feels jittery
- fix text, alignments, line counts, content in general in mobile view. looks good on desktop but not on mobile.
- add photo for different picture dimensions
- when pressing marc in header, introduce back the reload page used in the splash page.
- when in command k or ctrl k menu, searching and clicking on the different navigable tabs should not do a page reload to the part of the page but just an exit of the menu and a smooth animation transition to the page. also when searching it auto zooms in when pressing search bar. keep it the normal view when focusing and unfocusing unless zoomed in intentionally.`