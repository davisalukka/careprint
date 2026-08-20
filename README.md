# Careprint

Careprint is an interactive food-choice dashboard for people who want to reduce
their animal-welfare footprint without pretending that one score can capture the
whole moral reality of food production.

The product idea is simple:

1. A person describes a normal week of chicken, eggs, pork, beef, salmon, and
   milk.
2. Careprint estimates directional welfare pressure from frequency and source.
3. The dashboard ranks maneuvers by welfare gain per unit of effort.
4. The person previews a maneuver, such as switching to certified eggs, before
   applying it to their baseline.
5. The product can eventually recommend higher-welfare vendors through clearly
   disclosed referral partnerships, starting from a curated unmonetized
   directory.

The estimate is educational and directional. It is not a certification or a
universal ranking of suffering. We use the comparative term "higher-welfare"
throughout and never describe any product as "cruelty-free" — the first is
checkable, the second is not.

## Current status

The local MVP is functional and browser-verified. It includes:

- Overview, Analytics, and Baseline dashboard views.
- A living, animated "careprint" visual whose lobes react in real time to the
  welfare vectors you pick (servings and sources), on both the Overview card
  and the Baseline editor.
- A six-category model (chicken, eggs, pork, beef, salmon, milk) with
  0–14 weekly frequencies, certification-mapped source tiers, and baseline
  presets (typical omnivore, reducetarian, pescatarian, plant-forward).
- A `/methodology` page rendered from the same weight table the score uses,
  with cited sources, the certification taxonomy, uncertainty, FAQ, privacy,
  and disclosure sections.
- A directional uncertainty band displayed alongside every score.
- Maneuvers ranked by welfare gain per unit of effort, each tagged with its
  cost (💰 costs more / 🛒 different store / 🔁 habit change).
- A real weekly-trend chart built from saved check-ins (one `localStorage`
  snapshot per week) — no simulated history anywhere.
- Share-by-link (profile encoded in the URL fragment) and JSON export/import.
- An Analytics SVG dial, breakdown bars, and scenario comparison cards.
- Baseline autosave to `localStorage`, with v1 profiles migrated on load.
- A local-only curated vendor directory stub (KW/GTA pilot framing) with
  per-card verification labels and adjacent disclosure.
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
| `/methodology` | Every weight, its sources, uncertainty, privacy, and disclosure. |

Both are emitted as real static files (`dist/index.html` and
`dist/demo/index.html`), so deep links resolve without a client-side router or
a `404.html` rewrite.

There is no API. The dashboard reads its vendor fixtures directly from
`src/lib/integration-stubs.ts` and autosaves the baseline to `localStorage`
under `careprint:profile`.

## Architecture map

### Product UI

- `index.html` / `demo/index.html` / `methodology/index.html` — the static
  entry documents.
- `src/main-landing.tsx` / `src/main-demo.tsx` / `src/main-methodology.tsx` —
  React roots for each page.
- `src/LandingPage.tsx` — public landing page and product promise.
- `src/MethodologyPage.tsx` — the methodology page, rendered directly from the
  model's weight table so the published numbers can never drift from the score.
- `src/DemoPage.tsx` — demo shell with a fixed local user.
- `src/dashboard/DashboardClient.tsx` — client state, views, controls,
  maneuver application, and `localStorage` persistence.
- `src/dashboard/FootprintVisual.tsx` — the living careprint: an animated,
  organic SVG where each welfare vector is a lobe that grows, heats, calms, or
  shrinks to a seed as servings and sources change. Rendered on the Overview
  score card (reacting to maneuver previews) and beside the Baseline controls
  (reacting live to every input).
- `src/dashboard/FootprintVisual.module.css` — visual-specific animation and
  layout styles, including `prefers-reduced-motion` handling.
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

## The scoring model (v2)

The model deliberately stays explainable:

```text
weekly estimate = frequency × directional welfare signal
new estimate    = current baseline − one maneuver
```

The tracked categories are chicken, eggs, pork, beef, salmon, and milk, with
weekly quantities from 0 to 14 and certification-mapped source tiers. The
weights follow the per-serving ranking the welfare-economics literature keeps
converging on — caged eggs ≈ broiler chicken > farmed fish > pork >> beef >
milk — as a directional synthesis informed by the Welfare Footprint Project,
Fish Welfare Initiative, and Rethink Priorities. The `/methodology` page
renders the exact weight table from the model source with citations and
caveats. A plant-based source selection has a zero animal-choice signal for
that category; the plant-forward percentage counts those selections, not only
zero quantities.

Important model functions live in `src/lib/footprint-model.ts`:

- `calculateScore(profile)` — returns the bounded 0–100 directional estimate.
- `scoreBand(profile)` — the asymmetric uncertainty band shown in the UI.
- `calculatePlantShare(profile)` — returns the plant-forward percentage.
- `makeScenarios(profile)` — generates maneuvers ranked by welfare gain per
  unit of effort, each tagged cost / store / habit.
- `buildBreakdown(profile)` — produces contribution data for the bars.
- `recordCheckIn(history, score)` / `buildTrend(history)` — real weekly
  check-ins (one `localStorage` snapshot per week). There is no simulated
  history; with no check-ins the trend panel shows an empty state.
- `normalizeProfile(value)` — migrates v1 baselines and validates imports.
- `encodeProfile(profile)` / `decodeProfile(encoded)` — the share-link format.

Score-boundary and behavior tests for the model live in
`tests/footprint-model.test.mjs` and run against the TypeScript source via
Node's type stripping.

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
- Referral relationships must be disclosed adjacent to the affected cards, in
  plain language ("we may earn a referral fee if you order via this link or
  code"), per Ad Standards Canada guidance and the Competition Act's
  deceptive-marketing provisions.
- The vendor section launches as a curated, unmonetized directory (one region
  done well — KW/GTA) before any referral money is added.
- Recommendations should explain why a vendor appears, using the verification
  taxonomy on the methodology page (audited certifications > Canadian Organic >
  unverified marketing claims).
- Use "higher-welfare" consistently; never describe anything as "cruelty-free"
  (a test enforces this).
- The score must remain directional and transparent about uncertainty — the
  band is part of the product, not a footnote.
- Do not collect more personal food data than the product needs. A full privacy
  policy must exist before the first server-side record (dietary data plus
  postal code is more sensitive than it looks; PIPEDA applies the moment
  accounts exist).
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

Market-shaped validation comes before more infrastructure:

1. **Credibility test:** put the deployed demo in front of ~20 people from the
   target segment and ask one question — "Do you believe this number, and
   would it change what you buy?" If no, the fix is methodology, not features.
2. **Vendor willingness test:** ask five Ontario vendors (a mix of box
   services and direct farms) whether they'd pay per referred customer —
   coupon-code referrals beat tracking links for farm-direct sellers, and
   program availability must be verified directly, never assumed.
3. Add privacy-respecting, cookie-free analytics (e.g., Plausible or
   self-hosted Umami) so the validation tests are measurable. Requires an
   account/domain decision, which is why it isn't wired in yet.
4. Verify the deployed Pages site from an anonymous browser session.
5. Consider a "worldview slider" (e.g., weight on fish sentience) that visibly
   moves the score — the ambitious version of the uncertainty band.
6. Add durable per-user persistence. This needs a server (the scaffolded-and-
   removed Cloudflare Workers + D1 path is the cheapest), so it is the change
   that would move the site off GitHub Pages.
7. Replace directory placeholders with verified vendors (visit them), real
   service areas (FSA-prefix mapping, KW/GTA first), and pricing.
8. Run a Canadian trademark search on "Careprint" before investing further in
   the brand.

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
