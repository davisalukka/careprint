import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(pathname) {
  return readFile(new URL(pathname, root), "utf8");
}

test("the public page carries the Careprint product promise", async () => {
  const page = await source("app/page.tsx");
  assert.match(page, /Careprint — make the kindest next swap/);
  assert.match(page, /Make the kindest next swap\./);
  assert.match(page, /Directional, not absolute\./);
  assert.match(page, /Affiliate money stays visible\./);
});

test("the dashboard is sign-in gated and has a local profile route", async () => {
  const [dashboard, client, api, hosting, demo] = await Promise.all([
    source("app/dashboard/page.tsx"),
    source("app/dashboard/DashboardClient.tsx"),
    source("app/api/profile/route.ts"),
    source(".openai/hosting.json"),
    source("app/demo/page.tsx"),
  ]);

  assert.match(dashboard, /requireChatGPTUser\("\/dashboard"\)/);
  assert.match(client, /Try a maneuver/);
  assert.match(client, /Preview →/);
  assert.match(client, /AnalyticsPanel/);
  assert.match(client, /dashboard-view-tabs/);
  assert.match(client, /Apply & save/);
  assert.match(client, /\/api\/profile/);
  assert.match(api, /getChatGPTUser/);
  assert.match(api, /local-profile-stub/);
  assert.match(hosting, /"d1":\s*null/);
  assert.match(demo, /DashboardClient user=\{demoUser\} demoMode/);
});

test("external boundaries are deterministic local stubs", async () => {
  const [stubs, route, model] = await Promise.all([
    source("app/lib/integration-stubs.ts"),
    source("app/api/stubs/route.ts"),
    source("app/lib/footprint-model.ts"),
  ]);

  assert.match(stubs, /listMarketplaceOffers/);
  assert.match(stubs, /recordAffiliateClick/);
  assert.match(stubs, /affiliate_click/);
  assert.match(route, /kind === "vendors"/);
  assert.match(route, /export async function POST/);
  assert.doesNotMatch(stubs, /https?:\/\//);
  assert.match(model, /calculateScore/);
  assert.match(model, /calculatePlantShare/);
  assert.match(model, /buildTrend/);
});
