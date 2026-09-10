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
