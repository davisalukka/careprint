import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(pathname) {
  return readFile(new URL(pathname, root), "utf8");
}

test("the public page carries the Careprint product promise", async () => {
  const [page, shell] = await Promise.all([
    source("src/LandingPage.tsx"),
    source("index.html"),
  ]);

  assert.match(shell, /Careprint — make the kindest next swap/);
  assert.match(page, /Make the kindest next swap\./);
  assert.match(page, /Directional, not absolute\./);
  assert.match(page, /Affiliate money stays visible\./);
});

test("the demo mounts the dashboard with local-only state", async () => {
  const [demo, client] = await Promise.all([
    source("src/DemoPage.tsx"),
    source("src/dashboard/DashboardClient.tsx"),
  ]);

  assert.match(demo, /DashboardClient user=\{demoUser\} demoMode/);
  assert.match(client, /Try a maneuver/);
  assert.match(client, /Preview →/);
  assert.match(client, /AnalyticsPanel/);
  assert.match(client, /dashboard-view-tabs/);
  assert.match(client, /Apply & save/);
  // The static site has no server: the baseline autosaves to localStorage and
  // must never reach for an API route.
  assert.match(client, /localStorage/);
  assert.doesNotMatch(client, /\/api\//);
});

test("external boundaries are deterministic local stubs", async () => {
  const [stubs, marketplace, model] = await Promise.all([
    source("src/lib/integration-stubs.ts"),
    source("src/dashboard/MarketplacePanel.tsx"),
    source("src/lib/footprint-model.ts"),
  ]);

  assert.match(stubs, /listMarketplaceOffers/);
  assert.match(stubs, /recordAffiliateClick/);
  assert.match(stubs, /affiliate_click/);
  assert.doesNotMatch(stubs, /https?:\/\//);
  // Offers come straight from the local fixtures, with no fetch to a dead route.
  assert.match(marketplace, /listMarketplaceOffers\(\)/);
  assert.doesNotMatch(marketplace, /fetch\(/);
  assert.match(model, /calculateScore/);
  assert.match(model, /calculatePlantShare/);
  assert.match(model, /buildTrend/);
});

test("the build output is a GitHub Pages compatible static site", async () => {
  assert.ok(existsSync(new URL("dist/index.html", root)), "landing page is emitted");
  assert.ok(existsSync(new URL("dist/demo/index.html", root)), "demo is a real file, not a router fallback");
  assert.ok(existsSync(new URL("dist/.nojekyll", root)), ".nojekyll stops Jekyll stripping asset dirs");

  const [landing, demo] = await Promise.all([
    readFile(new URL("dist/index.html", root), "utf8"),
    readFile(new URL("dist/demo/index.html", root), "utf8"),
  ]);

  // Pages serves this project from /careprint/, so assets must carry the prefix.
  assert.match(landing, /src="\/careprint\/assets\//);
  assert.match(demo, /src="\/careprint\/assets\//);
});
