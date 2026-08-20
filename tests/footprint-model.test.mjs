// Unit tests for the score math — the product's core. Runs against the
// TypeScript source directly via Node's type stripping (--experimental-strip-types,
// on by default from Node 22.18).
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBreakdown,
  buildTrend,
  calculatePlantShare,
  calculateScore,
  cloneProfile,
  decodeProfile,
  DEFAULT_PROFILE,
  EFFORT_META,
  encodeProfile,
  FOOD_KEYS,
  FOOD_META,
  makeScenarios,
  MAX_SERVINGS,
  normalizeProfile,
  pointsFor,
  PRESETS,
  recordCheckIn,
  scoreBand,
  updateProfile,
  weekKey,
} from "../src/lib/footprint-model.ts";

function allPlantProfile() {
  const profile = cloneProfile(DEFAULT_PROFILE);
  for (const key of FOOD_KEYS) profile.sources[key] = "plant";
  return profile;
}

function maxConventionalProfile() {
  const profile = cloneProfile(DEFAULT_PROFILE);
  for (const key of FOOD_KEYS) {
    profile.servings[key] = MAX_SERVINGS;
    profile.sources[key] = "conventional";
  }
  return profile;
}

test("the category set covers the biggest welfare levers", () => {
  assert.deepEqual(FOOD_KEYS, ["chicken", "eggs", "pork", "beef", "salmon", "milk"]);
});

test("per-serving conventional weights follow the published ranking", () => {
  // caged eggs (per ~2-egg serving) ≈ broiler chicken > farmed fish > pork >> beef > milk
  const chicken = pointsFor("chicken", "conventional");
  const eggServing = 2 * pointsFor("eggs", "conventional");
  const salmon = pointsFor("salmon", "conventional");
  const pork = pointsFor("pork", "conventional");
  const beef = pointsFor("beef", "conventional");
  const milk = pointsFor("milk", "conventional");
  assert.equal(eggServing, chicken);
  assert.ok(chicken > salmon, "chicken outweighs farmed fish");
  assert.ok(salmon > pork, "farmed fish outweighs pork");
  assert.ok(pork > 2 * beef, "pork far outweighs beef per serving");
  assert.ok(beef > milk, "beef outweighs milk");
});

test("score boundaries hold: plant floor at 0, heavy conventional clamps at 100", () => {
  assert.equal(calculateScore(allPlantProfile()), 0);
  assert.equal(calculateScore(maxConventionalProfile()), 100);
  const empty = normalizeProfile({ servings: Object.fromEntries(FOOD_KEYS.map((key) => [key, 0])) });
  assert.equal(calculateScore(empty), 0);
});

test("every source tier is monotonic: kinder tiers never score higher", () => {
  for (const key of FOOD_KEYS) {
    const options = FOOD_META[key].sources;
    for (let i = 1; i < options.length; i += 1) {
      assert.ok(
        options[i].points <= options[i - 1].points,
        `${key}: ${options[i].label} should not outweigh ${options[i - 1].label}`,
      );
    }
    assert.equal(options[options.length - 1].points, 0, `${key}: plant tier scores zero`);
  }
});

test("plant-based sources count toward the plant share", () => {
  assert.equal(calculatePlantShare(allPlantProfile()), 100);
  const omnivore = PRESETS[0].profile;
  assert.ok(calculatePlantShare(omnivore) < 100);
  assert.ok(calculatePlantShare(omnivore) > 0);
});

test("updateProfile clamps servings and rejects invalid sources", () => {
  const over = updateProfile(DEFAULT_PROFILE, "eggs", { servings: 99 });
  assert.equal(over.servings.eggs, MAX_SERVINGS);
  const under = updateProfile(DEFAULT_PROFILE, "eggs", { servings: -5 });
  assert.equal(under.servings.eggs, 0);
  const bad = updateProfile(DEFAULT_PROFILE, "beef", { source: "wild" });
  assert.equal(bad.sources.beef, DEFAULT_PROFILE.sources.beef, "beef has no wild tier");
});

test("normalizeProfile migrates old and malformed data safely", () => {
  const v1 = { servings: { beef: 2, salmon: 1 }, sources: { beef: "pasture", salmon: "oceanwise" } };
  const migrated = normalizeProfile(v1);
  assert.equal(migrated.servings.beef, 2);
  assert.equal(migrated.sources.beef, "pasture", "v1 pasture beef survives migration");
  assert.equal(migrated.sources.salmon, DEFAULT_PROFILE.sources.salmon, "unknown v1 source falls back");
  assert.equal(migrated.servings.chicken, DEFAULT_PROFILE.servings.chicken, "missing categories get defaults");
  assert.deepEqual(normalizeProfile(null), DEFAULT_PROFILE);
  assert.deepEqual(normalizeProfile("junk"), DEFAULT_PROFILE);
});

test("share encoding round-trips and rejects junk", () => {
  const profile = PRESETS[1].profile;
  const decoded = decodeProfile(encodeProfile(profile));
  assert.deepEqual(decoded, profile);
  assert.equal(decodeProfile("not-a-link"), null);
  assert.equal(decodeProfile("v2-1a.2b"), null, "wrong category count");
  assert.equal(decodeProfile("v2-1z.1a.1a.1a.1a.1a"), null, "invalid tier letter");
});

test("the score band brackets the score and stays in range", () => {
  for (const preset of PRESETS) {
    const score = calculateScore(preset.profile);
    const band = scoreBand(preset.profile);
    assert.ok(band.low <= score && score <= band.high);
    assert.ok(band.low >= 0 && band.high <= 100);
  }
  assert.deepEqual(scoreBand(allPlantProfile()), { low: 0, high: 0 });
});

test("scenarios have positive impact and are ranked by gain per effort", () => {
  const profile = PRESETS[0].profile;
  const score = calculateScore(profile);
  const scenarios = makeScenarios(profile);
  assert.ok(scenarios.length > 0 && scenarios.length <= 5);
  const eased = scenarios.map((scenario) => {
    const delta = score - calculateScore(scenario.profile);
    assert.ok(delta > 0, `${scenario.id} must improve the score`);
    return delta / EFFORT_META[scenario.effort].weight;
  });
  for (let i = 1; i < eased.length; i += 1) {
    assert.ok(eased[i] <= eased[i - 1], "ranking is non-increasing in gain-per-effort");
  }
});

test("a fully plant-based baseline has no scenarios left to offer", () => {
  assert.deepEqual(makeScenarios(allPlantProfile()), []);
});

test("the eggs sourcing upgrade beats the beef frequency cut for a typical omnivore", () => {
  // The document's core claim: the certified-egg switch is the true
  // lowest-hanging fruit — high welfare delta, near-zero habit change.
  const profile = PRESETS[0].profile;
  const scenarios = makeScenarios(profile);
  const eggsRank = scenarios.findIndex((scenario) => scenario.id === "eggs-upgrade");
  const beefRank = scenarios.findIndex((scenario) => scenario.id === "beef-less");
  assert.ok(eggsRank !== -1, "eggs upgrade is offered");
  assert.ok(beefRank === -1 || eggsRank < beefRank, "eggs upgrade ranks above cutting beef");
});

test("check-ins upsert by week and the trend is built only from real data", () => {
  const monday = weekKey(new Date("2026-08-19T12:00:00"));
  assert.equal(monday, "2026-08-17");
  let history = recordCheckIn([], 60, new Date("2026-08-12T09:00:00"));
  history = recordCheckIn(history, 55, new Date("2026-08-19T09:00:00"));
  history = recordCheckIn(history, 51, new Date("2026-08-20T21:00:00"));
  assert.equal(history.length, 2, "same-week saves overwrite, not append");
  assert.equal(history[1].score, 51);
  const trend = buildTrend(history);
  assert.equal(trend.length, 2);
  assert.equal(trend[1].note, "Latest check-in");
  assert.deepEqual(buildTrend([]), [], "no fake history");
});

test("breakdown covers every category with its own color", () => {
  const breakdown = buildBreakdown(DEFAULT_PROFILE);
  assert.equal(breakdown.length, FOOD_KEYS.length);
  assert.equal(new Set(breakdown.map((point) => point.color)).size, FOOD_KEYS.length);
});
