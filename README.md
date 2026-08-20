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
- Local autosave behavior for the demo session.
- Local-only vendor catalog, availability, subscription, and affiliate-click
  stubs.
- A production-style ChatGPT sign-in path for `/dashboard`.
- A local-only `/demo` route that does not call external services.

The hosted Sites project has been created, but it is not deployed yet. The
hosting metadata is in `.openai/hosting.json`. The host still needs its
configured source branch populated before a version can be saved and deployed.
See [Deploying](#deploying) for the free Cloudflare Workers path, which does not
depend on Sites.

The GitHub repository associated with this project is
[`davisalukka/careprint`](https://github.com/davisalukka/careprint). This new
workspace intentionally does not contain the old workspace's Git history; the
next owner should initialize Git here and push the desired history.

## Routes and entry points

| Route | Purpose |
| --- | --- |
| `/` | Public Careprint landing page. |
| `/demo` | Local-only interactive demo. In production it redirects to sign-in. |
| `/dashboard` | ChatGPT-sign-in-gated account dashboard. |
| `/api/profile` | Profile load/save boundary. Currently uses an in-memory local stub. |
| `/api/stubs?kind=vendors` | Local vendor offers and catalog fixtures. |
| `/api/stubs?kind=availability` | Local inventory/availability fixtures. |
| `/api/stubs?kind=subscriptions` | Local subscription fixtures. |
| `POST /api/stubs` | Records a local `affiliate_click` event; it never redirects externally. |

## Architecture map

### Product UI

- `app/page.tsx` — public landing page and product promise.
- `app/demo/page.tsx` — demo shell with a fake local user.
- `app/dashboard/page.tsx` — authenticated dashboard shell.
- `app/dashboard/DashboardClient.tsx` — client state, views, controls,
  maneuver application, and persistence orchestration.
- `app/dashboard/AnalyticsPanel.tsx` — accessible dial, breakdown, trend, and
  scenario-comparison views.
- `app/dashboard/AnalyticsPanel.module.css` — Analytics-specific responsive
  styling.
- `app/dashboard/MarketplacePanel.tsx` — local partner cards and stubbed click
  events.
- `app/globals.css` — landing page and dashboard design system/styles.

### Domain model

- `app/lib/footprint-model.ts` — shared types and deterministic model logic.
- `app/lib/profile-stub.ts` — in-memory profile persistence seam.
- `app/lib/integration-stubs.ts` — vendor, availability, subscription, and
  affiliate-event fixtures.

### Server boundaries

- `app/api/profile/route.ts` — validates profile payloads and reads/writes the
  local profile stub. It still uses the real ChatGPT identity boundary when the
  authenticated dashboard is used.
- `app/api/stubs/route.ts` — exposes the local integration fixtures and accepts
  click events.
- `app/chatgpt-auth.ts` — Sign in with ChatGPT helper boundary supplied by the
  Sites/vinext environment.

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

Important model functions live in `app/lib/footprint-model.ts`:

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
- Profile persistence is local in memory.
- D1 and R2 are intentionally unset in `.openai/hosting.json`.

When real services are introduced, preserve these boundaries. Replace the
implementation behind the existing route/module contracts rather than mixing
vendor SDK calls into scoring or UI components.

The one intentional production boundary is ChatGPT identity. `/dashboard`
requires the platform sign-in flow; `/demo` bypasses it only for local
development and uses a fake `demo-user`.

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

- `http://localhost:3000/` for the landing page.
- `http://localhost:3000/demo` for the interactive local demo.

Useful checks:

```bash
npm run build
npm run lint
npm test
```

`npm test` builds the app and runs the rendered-source checks in
`tests/rendered-html.test.mjs`.

## Hosting handoff

The intended publishing sequence is:

1. Initialize Git in `/Users/davis/Documents/Careprint`.
2. Review the files and push the desired source to the GitHub repository.
3. Populate the hosting provider's configured source branch for the Sites
   project represented by `.openai/hosting.json`.
4. Build and package the exact source state.
5. Save a Sites version and deploy it.
6. Set access to a shareable public URL if the goal is to show friends outside
   the workspace.
7. Verify `/`, `/demo`, `/api/stubs?kind=vendors`, and the key dashboard flows
   on the deployed URL.

Pushing to GitHub and publishing to Sites are separate source-control steps in
the current hosting setup. Do not assume that a GitHub push alone creates a
live Sites deployment.

## Deploying

### Why not GitHub Pages

GitHub Pages serves static files only. Careprint renders on the server: `/` and
`/dashboard` call `headers()` through `app/chatgpt-auth.ts`, and `/api/profile`
and `/api/stubs` are request handlers. A static export would drop all of it, so
Pages is not a viable host for this app.

### Cloudflare Workers (free tier)

The app already targets Workers — `worker/index.ts` is the entry point and
`@cloudflare/vite-plugin` is wired up in `vite.config.ts`. The Workers free plan
covers basic dev usage.

One-time setup:

1. `npx wrangler login` (or set `CLOUDFLARE_API_TOKEN` from an **Edit Cloudflare
   Workers** token for non-interactive use).
2. Set `CLOUDFLARE_ACCOUNT_ID`, or add `account_id` to the deploy config.

Then:

```bash
npm run deploy
```

That builds and publishes to `careprint.<your-subdomain>.workers.dev`.

Deploy settings — worker name, bindings, compatibility date — live in the
committed `wrangler.jsonc`. `vinext deploy` writes that file only when it is
missing, so edits there are preserved. The separate `dist/server/wrangler.json`
is a build artifact generated from `localBindingConfig` in `vite.config.ts` and
drives `npm run dev`; it is not the deploy config. Keep the worker name in sync
across both if you change it.

Pushes to `main` deploy automatically via `.github/workflows/deploy.yml`, which
needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.

### Authentication on non-Sites hosts

`app/chatgpt-auth.ts` reads `oai-authenticated-user-*` request headers that the
Sites proxy injects. Nothing sets them on Workers, so `/dashboard` redirects to
`/signin-with-chatgpt`, which only exists behind Sites. On a Workers deploy,
expect `/` and the API routes to work and `/dashboard` to stay gated until that
auth layer is replaced.

So that a Workers deploy is explorable, `npm run deploy` sets
`CAREPRINT_ENABLE_DEMO=1`, which un-gates `/demo` — the full dashboard UI backed
by local stubs, calling no external services. The flag is inlined at build time
via `define` in `vite.config.ts`; workerd does not populate `process.env` from
Wrangler `vars`, so a runtime lookup would silently read as undefined. Builds
that leave the flag unset keep the original production gating, so Sites builds
are unaffected.

## Recommended next work

1. Finish the first public Sites deployment and verify it from an anonymous
   browser session.
2. Replace `app/lib/profile-stub.ts` with durable per-user persistence.
3. Add real check-in history so the Analytics trend is no longer simulated.
4. Define and document the welfare-signal methodology with evidence and an
   uncertainty/assumption layer.
5. Add vendor verification, service-area, pickup, subscription, and pricing
   data behind the existing stub contracts.
6. Add privacy policy, affiliate disclosure, and an explanation of what the
   score does and does not mean.
7. Add unit and behavior coverage for score boundaries, plant-source handling,
   user isolation, maneuver saves, and stubbed partner events.

## Starter references

This app uses [vinext](https://github.com/cloudflare/vinext) with React and
Next-compatible routing. The original starter also contains optional Drizzle
and D1 scaffolding under `db/`, `drizzle/`, and `examples/d1/`; those surfaces
are not part of the active local MVP until durable persistence is intentionally
introduced.
