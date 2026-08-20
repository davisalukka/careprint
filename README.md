# Careprint

Careprint is an interactive food-choice dashboard for people who want to reduce
their animal-cruelty footprint without pretending that one score can capture the
whole moral reality of food production.

The product idea is simple:

1. A person describes a normal week of beef, salmon, eggs, and milk.
2. Careprint estimates directional welfare pressure from frequency and source.
3. The dashboard identifies the lowest-hanging fruit.
4. The person previews a maneuver, such as making beef occasional, before
   applying it to their baseline.
5. The product can eventually recommend lower-footprint vendors through clearly
   disclosed affiliate partnerships.

The estimate is educational and directional. It is not a certification, a
universal ranking of suffering, or a claim that one source is definitively
cruelty-free.

## Current status

The local MVP is functional and browser-verified. It includes:

- Overview, Analytics, and Baseline dashboard views.
- An interactive score ring and Analytics SVG dial.
- Breakdown bars, a weekly trend chart/table, and scenario comparison cards.
- Frequency controls and source selectors that recalculate the estimate.
- Maneuver preview plus `Apply & save` behavior.
- Baseline autosave to `localStorage`.
- Local-only vendor catalog, availability, subscription, and affiliate-click
  stubs.
- A `/demo` route that does not call external services.

Careprint is a static site deployed to GitHub Pages at
<https://davisalukka.github.io/careprint/>. It is a plain Vite + React build:
every page is a real HTML file, there is no server, and no request leaves the
browser. See [Deploying](#deploying).

The GitHub repository associated with this project is
[`davisalukka/careprint`](https://github.com/davisalukka/careprint). This new
workspace intentionally does not contain the old workspace's Git history; the
next owner should initialize Git here and push the desired history.

## Routes and entry points

| Route | Purpose |
| --- | --- |
| `/` | Public Careprint landing page. |
| `/demo` | The interactive dashboard, running entirely in the browser. |

Both are emitted as real static files (`dist/index.html` and
`dist/demo/index.html`), so deep links resolve without a client-side router or
a `404.html` rewrite.

There is no API. The dashboard reads its vendor fixtures directly from
`src/lib/integration-stubs.ts` and autosaves the baseline to `localStorage`
under `careprint:profile`.

## Architecture map

### Product UI

- `index.html` / `demo/index.html` — the two static entry documents.
- `src/main-landing.tsx` / `src/main-demo.tsx` — React roots for each page.
- `src/LandingPage.tsx` — public landing page and product promise.
- `src/DemoPage.tsx` — demo shell with a fixed local user.
- `src/dashboard/DashboardClient.tsx` — client state, views, controls,
  maneuver application, and `localStorage` persistence.
- `src/dashboard/AnalyticsPanel.tsx` — accessible dial, breakdown, trend, and
  scenario-comparison views.
- `src/dashboard/AnalyticsPanel.module.css` — Analytics-specific responsive
  styling.
- `src/dashboard/MarketplacePanel.tsx` — partner cards read from the local
  fixtures, with in-memory click events.
- `src/globals.css` — landing page and dashboard design system/styles.
- `src/paths.ts` — base-path-aware internal links.

### Domain model

- `src/lib/footprint-model.ts` — shared types and deterministic model logic.
- `src/lib/integration-stubs.ts` — vendor, availability, subscription, and
  affiliate-event fixtures.

## The scoring model

The model deliberately stays explainable:

```text
weekly estimate = frequency × directional welfare signal
new estimate    = current baseline − one maneuver
```

The tracked categories are:

- Beef
- Salmon
- Eggs
- Milk

Each category has a weekly quantity from 0 to 3 and a source selection. A
plant-based source selection has a zero animal-choice signal for that category.
The plant-forward percentage is based on the source selections and quantities,
not only on whether the quantity is zero.

Important model functions live in `src/lib/footprint-model.ts`:

- `calculateScore(profile)` — returns the bounded 0–100 directional estimate.
- `calculatePlantShare(profile)` — returns the plant-forward percentage.
- `makeScenarios(profile)` — generates the available next maneuvers.
- `buildBreakdown(profile)` — produces contribution data for the bars.
- `buildTrend(profile)` — creates a deterministic simulated history for the
  current baseline.

The trend is explicitly labeled simulated until real weekly check-ins exist.
Do not present it as historical user data.

## Integration boundaries

Everything that could create an external dependency is stubbed for the MVP:

- Vendor offers are local fixtures.
- Availability and subscriptions are local fixtures.
- Partner clicks are recorded in memory and never leave the app.
- Profile persistence is the browser's own `localStorage`.

When real services are introduced, preserve these boundaries. Replace the
implementation behind the existing module contracts rather than mixing vendor
SDK calls into scoring or UI components. Anything needing a secret or a
per-user record also needs a server, which a static host cannot provide.

## Affiliate and ethical guardrails

These are product requirements, not optional copy:

- Paid placement must never change score math or partner ranking.
- Affiliate relationships must be disclosed near the partner cards.
- Recommendations should explain why a vendor appears.
- “Cruelty-free” should not be treated as a binary certification without a
  defensible standard and evidence.
- The score should remain directional and transparent about uncertainty.
- Do not collect more personal food data than the product needs.
- Real persistence must be isolated per authenticated user.

## Local development

Prerequisite: Node.js `>=22.13.0`.

From this directory:

```bash
npm install
npm run dev
```

Then open:

- `http://localhost:5173/` for the landing page.
- `http://localhost:5173/demo/` for the interactive demo.

The dev server runs from `/`, while the deployed site is served from
`/careprint/`. Links use Vite's `BASE_URL` so both work from the same source.

Useful checks:

```bash
npm run build   # typechecks, then builds to dist/
npm run lint
npm test
npm run preview # serve the built site locally
```

`npm test` builds the site and runs the checks in
`tests/rendered-html.test.mjs`, which cover the product copy, the local-only
data boundaries, and the Pages requirements of the build output.

## Deploying

The site deploys to GitHub Pages from `.github/workflows/deploy.yml` on every
push to `main`. The workflow typechecks, lints, builds, and publishes `dist/`
using the standard `actions/deploy-pages` flow.

One-time repository setup:

1. The repository must be public, or on a plan that includes Pages for private
   repositories.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**

No tokens or secrets are needed — the workflow authenticates with the built-in
`GITHUB_TOKEN`.

### The base path

Pages serves a project site from `/<repo>/`, so the bundle is built with
`base: "/careprint/"` (`vite.config.ts`). Internal links read
`import.meta.env.BASE_URL` rather than hardcoding it.

If you later move to a user site (`davisalukka.github.io`) or a custom domain,
the site is served from the root instead — build with `BASE_PATH=/` and no
other change is needed.

`public/.nojekyll` stops GitHub from running Jekyll over the output, which would
otherwise strip directories that Vite emits.

### What a static host cannot do

The earlier ChatGPT sign-in flow, the `/dashboard` route, and the `/api/*`
handlers all required a server and were removed. `/demo` carries the full
dashboard UI instead, backed by local fixtures and `localStorage`. Restoring
per-user accounts means reintroducing a server and a host that can run one.

## Recommended next work

1. Verify the deployed Pages site from an anonymous browser session.
2. Add durable per-user persistence. This needs a server and a host that can
   run one, so it is the change that would move the site off GitHub Pages.
3. Add real check-in history so the Analytics trend is no longer simulated.
4. Define and document the welfare-signal methodology with evidence and an
   uncertainty/assumption layer.
5. Add vendor verification, service-area, pickup, subscription, and pricing
   data behind the existing stub contracts.
6. Add privacy policy, affiliate disclosure, and an explanation of what the
   score does and does not mean.
7. Add unit and behavior coverage for score boundaries, plant-source handling,
   user isolation, maneuver saves, and stubbed partner events.

## Stack

- [Vite](https://vite.dev/) for the build, with
  [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react).
- React 19, with no framework router: each route is its own HTML entry.
- Tailwind's preflight via `@tailwindcss/postcss`; all component styling is
  hand-written CSS in `src/globals.css`.

The project previously ran on [vinext](https://github.com/cloudflare/vinext)
with Next-compatible routing, Cloudflare Workers, and optional Drizzle/D1
scaffolding. Those were removed when the site moved to GitHub Pages, which
serves static files only. They remain in the Git history.
