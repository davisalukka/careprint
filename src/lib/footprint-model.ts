/**
 * Careprint footprint model v2.
 *
 * Six tracked categories, weighted so the per-serving ranking follows the
 * published welfare-economics consensus:
 *
 *   caged eggs ≈ broiler chicken > farmed fish > pork >> beef > milk
 *
 * The weights are a directional synthesis informed by the Welfare Footprint
 * Project's time-in-pain estimates, Fish Welfare Initiative research, and
 * Rethink Priorities' welfare-range work — not numbers lifted from any single
 * source. Every figure carries wide uncertainty; the /methodology page shows
 * this table with citations and caveats, and the UI exposes the band via
 * `scoreBand`. Paid placement must never change anything in this file.
 */

export type FoodKey = "chicken" | "eggs" | "pork" | "beef" | "salmon" | "milk";
export type SourceKey = "conventional" | "unverified" | "certified" | "pasture" | "wild" | "plant";

export type Profile = {
  servings: Record<FoodKey, number>;
  sources: Record<FoodKey, SourceKey>;
};

export type SourceOption = { key: SourceKey; label: string; points: number; verification: string };
export type FoodMeta = {
  label: string;
  unit: string;
  icon: string;
  rationale: string;
  sources: SourceOption[];
};

export type EffortKind = "cost" | "store" | "habit";
export type EffortMeta = { icon: string; label: string; weight: number };

export type Scenario = {
  id: string;
  title: string;
  description: string;
  effort: EffortKind;
  icon: string;
  tone: "mint" | "coral" | "yellow";
  profile: Profile;
};

export type BreakdownPoint = {
  key: FoodKey;
  label: string;
  value: number;
  detail: string;
  color: string;
};

export type TrendPoint = {
  label: string;
  score: number;
  note: string;
};

export type CheckIn = { week: string; score: number };

export type PresetKey = "omnivore" | "reducetarian" | "pescatarian" | "plant_forward";
export type Preset = { key: PresetKey; label: string; description: string; profile: Profile };

export const FOOD_KEYS: FoodKey[] = ["chicken", "eggs", "pork", "beef", "salmon", "milk"];

export const MAX_SERVINGS = 14;

// Raw weekly points that map to a score of 100. Chosen so a heavy
// all-conventional week clamps at the top and a typical omnivore week lands
// in the middle of the scale.
const SCORE_REFERENCE_RAW = 320;

export const FOOD_META: Record<FoodKey, FoodMeta> = {
  chicken: {
    label: "Chicken", unit: "meals / week", icon: "❋",
    rationale:
      "Small animals mean many lives per serving: one chicken is roughly 15–20 meals, and conventional broilers live in the worst average conditions of any major category. For most omnivores this is the single biggest lever on the board.",
    sources: [
      { key: "conventional", label: "Conventional broiler", points: 20, verification: "No welfare certification; fast-growing breeds at standard stocking density." },
      { key: "certified", label: "Certified higher-welfare", points: 12, verification: "Certified Humane, Animal Welfare Approved, or a verified slower-growing breed program." },
      { key: "plant", label: "Plant-based swap", points: 0, verification: "No animal in the supply chain." },
    ],
  },
  eggs: {
    label: "Eggs", unit: "eggs / week", icon: "○",
    rationale:
      "Per serving, caged eggs sit alongside chicken at the top of the welfare-pressure ranking (Welfare Footprint Project's hen time-in-pain estimates). Housing system changes the picture dramatically, which is why the tiers matter most here.",
    sources: [
      { key: "conventional", label: "Caged / unknown", points: 10, verification: "Battery or enriched cages, or no information — the honest default when the carton doesn't say." },
      { key: "unverified", label: "Free-run (uncertified claim)", points: 8, verification: "A marketing claim with no third-party audit. Better than caged, but treat with less trust." },
      { key: "certified", label: "Certified free-range", points: 5, verification: "Certified Humane, BC SPCA Certified, or equivalent audited free-range standard." },
      { key: "pasture", label: "Certified pasture-raised", points: 3, verification: "Audited pasture access (e.g., Animal Welfare Approved, Certified Humane pasture tier)." },
      { key: "plant", label: "Plant-based swap", points: 0, verification: "No animal in the supply chain." },
    ],
  },
  pork: {
    label: "Pork", unit: "meals / week", icon: "◆",
    rationale:
      "Pigs are highly cognitively capable, and conventional systems still use confinement practices — gestation crates chief among them — that certified tiers prohibit.",
    sources: [
      { key: "conventional", label: "Conventional", points: 12, verification: "No welfare certification; confinement practices are standard." },
      { key: "certified", label: "Certified crate-free", points: 7, verification: "Certified Humane, Animal Welfare Approved, or an audited crate-free program." },
      { key: "plant", label: "Plant-based swap", points: 0, verification: "No animal in the supply chain." },
    ],
  },
  beef: {
    label: "Beef", unit: "meals / week", icon: "✦",
    rationale:
      "Per serving, beef is one of the smaller welfare levers: one animal is hundreds of meals and cattle spend most of their lives outdoors. (Climate is a different question — this score measures welfare only.)",
    sources: [
      { key: "conventional", label: "Conventional / feedlot-finished", points: 5, verification: "No welfare certification; feedlot finishing is standard." },
      { key: "pasture", label: "Certified pasture-raised", points: 3, verification: "Audited pasture or grass-fed program (e.g., Animal Welfare Approved)." },
      { key: "plant", label: "Plant-based swap", points: 0, verification: "No animal in the supply chain." },
    ],
  },
  salmon: {
    label: "Salmon", unit: "meals / week", icon: "≈",
    rationale:
      "Farmed fish live in high-density conditions and slaughter welfare is largely unregulated; per-serving pressure lands between chicken and pork. Fish sentience carries real uncertainty, which the score band reflects.",
    sources: [
      { key: "conventional", label: "Farmed / unknown", points: 14, verification: "Conventional aquaculture, or no information about origin." },
      { key: "certified", label: "Certified higher-welfare farm", points: 10, verification: "An audited welfare standard covering density and slaughter (still rare in Canada)." },
      { key: "wild", label: "Wild-caught", points: 9, verification: "Wild fisheries avoid farm conditions; capture and slaughter stress remain." },
      { key: "plant", label: "Plant-based swap", points: 0, verification: "No animal in the supply chain." },
    ],
  },
  milk: {
    label: "Milk", unit: "litres / week", icon: "⌁",
    rationale:
      "Per litre, milk carries the lowest direct welfare pressure of the tracked categories — one cow produces thousands of litres — though dairy systems raise real concerns the tiers reflect.",
    sources: [
      { key: "conventional", label: "Conventional", points: 2, verification: "No welfare certification." },
      { key: "certified", label: "Certified higher-welfare", points: 1, verification: "Certified Humane dairy, or a verified pasture-based local program." },
      { key: "plant", label: "Plant-based swap", points: 0, verification: "No animal in the supply chain." },
    ],
  },
};

export const EFFORT_META: Record<EffortKind, EffortMeta> = {
  cost: { icon: "💰", label: "Costs a little more", weight: 1 },
  store: { icon: "🛒", label: "Different store", weight: 1.3 },
  habit: { icon: "🔁", label: "Habit change", weight: 1.7 },
};

export const PRESETS: Preset[] = [
  {
    key: "omnivore",
    label: "Typical omnivore",
    description: "Meat most days, eggs and milk in the mix, no particular sourcing.",
    profile: {
      servings: { chicken: 3, eggs: 6, pork: 1, beef: 2, salmon: 1, milk: 3 },
      sources: { chicken: "conventional", eggs: "conventional", pork: "conventional", beef: "conventional", salmon: "conventional", milk: "conventional" },
    },
  },
  {
    key: "reducetarian",
    label: "Reducetarian",
    description: "Less of everything, certified sources where they exist.",
    profile: {
      servings: { chicken: 1, eggs: 4, pork: 1, beef: 1, salmon: 1, milk: 2 },
      sources: { chicken: "certified", eggs: "certified", pork: "certified", beef: "pasture", salmon: "wild", milk: "certified" },
    },
  },
  {
    key: "pescatarian",
    label: "Pescatarian",
    description: "Fish and eggs, no land meat.",
    profile: {
      servings: { chicken: 0, eggs: 6, pork: 0, beef: 0, salmon: 3, milk: 2 },
      sources: { chicken: "plant", eggs: "certified", pork: "plant", beef: "plant", salmon: "wild", milk: "certified" },
    },
  },
  {
    key: "plant_forward",
    label: "Plant-forward",
    description: "Plant-based swaps across the board.",
    profile: {
      servings: { chicken: 2, eggs: 4, pork: 0, beef: 0, salmon: 1, milk: 4 },
      sources: { chicken: "plant", eggs: "plant", pork: "plant", beef: "plant", salmon: "plant", milk: "plant" },
    },
  },
];

export const DEFAULT_PROFILE: Profile = cloneProfile(PRESETS[0].profile);

export function cloneProfile(profile: Profile): Profile {
  return { servings: { ...profile.servings }, sources: { ...profile.sources } };
}

export function updateProfile(profile: Profile, key: FoodKey, changes: { servings?: number; source?: SourceKey }): Profile {
  const next = cloneProfile(profile);
  if (typeof changes.servings === "number") next.servings[key] = clampServings(changes.servings);
  if (changes.source && isSourceFor(key, changes.source)) next.sources[key] = changes.source;
  return next;
}

/** Coerce anything (old v1 baselines, imported JSON, decoded links) into a valid v2 profile. */
export function normalizeProfile(value: unknown): Profile {
  const next = cloneProfile(DEFAULT_PROFILE);
  if (typeof value !== "object" || value === null) return next;
  const record = value as { servings?: Record<string, unknown>; sources?: Record<string, unknown> };
  for (const key of FOOD_KEYS) {
    const servings = record.servings?.[key];
    if (typeof servings === "number" && Number.isFinite(servings)) next.servings[key] = clampServings(servings);
    const source = record.sources?.[key];
    if (typeof source === "string" && isSourceFor(key, source)) next.sources[key] = source;
  }
  return next;
}

export function pointsFor(key: FoodKey, source: SourceKey): number {
  return FOOD_META[key].sources.find((option) => option.key === source)?.points ?? 0;
}

export function calculateScore(profile: Profile): number {
  const rawScore = FOOD_KEYS.reduce((total, key) => total + profile.servings[key] * pointsFor(key, profile.sources[key]), 0);
  return Math.max(0, Math.min(100, Math.round((rawScore / SCORE_REFERENCE_RAW) * 100)));
}

/**
 * The honest error bars. The weights are directional syntheses of published
 * research, so the score is a band, not a point — asymmetric because the
 * biggest open questions (fish sentience, hen time-in-pain by system) mostly
 * push pressure up.
 */
export function scoreBand(profile: Profile): { low: number; high: number } {
  const score = calculateScore(profile);
  return {
    low: Math.max(0, Math.round(score * 0.75)),
    high: Math.min(100, Math.round(score * 1.3)),
  };
}

export function calculatePlantShare(profile: Profile): number {
  const cap = 42;
  const weeklyAnimalChoices = FOOD_KEYS.reduce((total, key) => total + (profile.sources[key] === "plant" ? 0 : profile.servings[key]), 0);
  return Math.max(0, Math.min(100, Math.round((1 - Math.min(cap, weeklyAnimalChoices) / cap) * 100)));
}

export function scoreLabel(score: number): string {
  if (score <= 25) return "Very low pressure";
  if (score <= 45) return "Low pressure";
  if (score <= 65) return "Moderate pressure";
  return "High pressure";
}

export function formatServing(value: number, unit: string): string {
  if (value === 0) return "None";
  return `${value} ${value === 1 ? unit.replace(/s$/, "") : unit}`;
}

const FREQUENCY_MOVES: Record<FoodKey, { title: string; description: string; step: number }> = {
  chicken: { title: "Make chicken occasional", description: "One fewer chicken meal a week — small animals mean many lives per serving, so this is usually the biggest lever on the board. Usually saves money.", step: 1 },
  eggs: { title: "Ease off the eggs", description: "A couple fewer eggs a week adds up fast, especially at the caged tier. Usually saves money.", step: 2 },
  pork: { title: "Make pork occasional", description: "Swap one pork meal for beans, lentils, or tofu. Usually saves money.", step: 1 },
  beef: { title: "Make beef occasional", description: "Per serving beef is a smaller lever than chicken, but every step counts. Usually saves money.", step: 1 },
  salmon: { title: "Make salmon a treat", description: "Same fish, fewer appearances. Usually saves money.", step: 1 },
  milk: { title: "Pour a little less milk", description: "Trim a litre a week without changing anything else.", step: 1 },
};

const UPGRADE_MOVES: Record<FoodKey, { title: string; description: string; effort: EffortKind }> = {
  chicken: { title: "Choose certified higher-welfare chicken", description: "Same meals, a much better life behind them. Look for Certified Humane or a slower-growing breed program.", effort: "store" },
  eggs: { title: "Switch to certified pasture-raised eggs", description: "Same recipes, and usually the cheapest welfare win on the board — about $2 more per carton.", effort: "cost" },
  pork: { title: "Choose certified crate-free pork", description: "The certification's main job is banning gestation crates. Same cuts, audited difference.", effort: "store" },
  beef: { title: "Choose certified pasture-raised beef", description: "An audited grass-fed or pasture program over feedlot finishing.", effort: "store" },
  salmon: { title: "Pick wild-caught over farmed", description: "Wild fish skip the high-density farm conditions that carry most of the pressure.", effort: "cost" },
  milk: { title: "Choose certified higher-welfare milk", description: "A certified dairy or verified pasture-based local program.", effort: "cost" },
};

const FOOD_TONES: Record<FoodKey, Scenario["tone"]> = {
  chicken: "coral", eggs: "yellow", pork: "coral", beef: "coral", salmon: "mint", milk: "mint",
};

/**
 * Generate candidate maneuvers and rank them by welfare gain per unit of
 * effort — a sourcing upgrade that costs $2 outranks a same-sized win that
 * needs a habit change. Top five, positive-impact only.
 */
export function makeScenarios(profile: Profile): Scenario[] {
  const currentScore = calculateScore(profile);
  const candidates: Scenario[] = [];

  for (const key of FOOD_KEYS) {
    const source = profile.sources[key];
    if (source === "plant") continue;

    if (profile.servings[key] > 0) {
      const move = FREQUENCY_MOVES[key];
      const next = cloneProfile(profile);
      next.servings[key] = Math.max(0, next.servings[key] - move.step);
      candidates.push({ id: `${key}-less`, title: move.title, description: move.description, effort: "habit", icon: FOOD_META[key].icon, tone: FOOD_TONES[key], profile: next });
    }

    const animalTiers = FOOD_META[key].sources.filter((option) => option.key !== "plant");
    const bestTier = animalTiers.reduce((best, option) => (option.points < best.points ? option : best));
    if (bestTier.key !== source && bestTier.points < pointsFor(key, source)) {
      const move = UPGRADE_MOVES[key];
      const next = cloneProfile(profile);
      next.sources[key] = bestTier.key;
      candidates.push({ id: `${key}-upgrade`, title: move.title, description: move.description, effort: move.effort, icon: FOOD_META[key].icon, tone: FOOD_TONES[key], profile: next });
    }
  }

  if (profile.sources.milk !== "plant" && profile.servings.milk > 0) {
    const next = cloneProfile(profile);
    next.sources.milk = "plant";
    candidates.push({ id: "milk-plant", title: "Make plant milk the default", description: "Save dairy for the moments where it actually matters to you.", effort: "habit", icon: FOOD_META.milk.icon, tone: "mint", profile: next });
  }

  return candidates
    .map((scenario) => ({ scenario, delta: currentScore - calculateScore(scenario.profile) }))
    .filter((entry) => entry.delta > 0)
    .sort((a, b) => b.delta / EFFORT_META[b.scenario.effort].weight - a.delta / EFFORT_META[a.scenario.effort].weight)
    .slice(0, 5)
    .map((entry) => entry.scenario);
}

export function buildBreakdown(profile: Profile): BreakdownPoint[] {
  const colors: Record<FoodKey, string> = {
    chicken: "#b98a4f", eggs: "#e8bd58", pork: "#c98b9e", beef: "#e27352", salmon: "#6f9fa6", milk: "#8db59a",
  };
  return FOOD_KEYS.map((key) => ({
    key,
    label: FOOD_META[key].label,
    value: profile.servings[key] * pointsFor(key, profile.sources[key]),
    detail: `${profile.servings[key]} × ${pointsFor(key, profile.sources[key])} signal`,
    color: colors[key],
  }));
}

/** Monday of the given date's week, as a local YYYY-MM-DD key. */
export function weekKey(date: Date = new Date()): string {
  const monday = new Date(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");
  return `${monday.getFullYear()}-${month}-${day}`;
}

/** Upsert this week's check-in, keeping at most the last 26 weeks. */
export function recordCheckIn(history: readonly CheckIn[], score: number, date: Date = new Date()): CheckIn[] {
  const week = weekKey(date);
  const kept = history.filter((entry) => entry && entry.week !== week && typeof entry.score === "number");
  return [...kept, { week, score }].sort((a, b) => a.week.localeCompare(b.week)).slice(-26);
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Real saved check-ins only — no simulated history. With zero entries the
 * analytics panel shows its empty state instead of a fake chart.
 */
export function buildTrend(history: readonly CheckIn[]): TrendPoint[] {
  const sorted = [...history].sort((a, b) => a.week.localeCompare(b.week));
  return sorted.map((entry, index) => {
    const [, month, day] = entry.week.split("-").map(Number);
    const label = `${MONTH_LABELS[(month ?? 1) - 1]} ${day ?? 1}`;
    return {
      label,
      score: Math.max(0, Math.min(100, Math.round(entry.score))),
      note: index === sorted.length - 1 ? "Latest check-in" : "Saved check-in",
    };
  });
}

const SHARE_PREFIX = "v2-";
const SOURCE_LETTERS = "abcdef";

/** Compact URL-fragment encoding: servings + source-tier letter per category. */
export function encodeProfile(profile: Profile): string {
  const parts = FOOD_KEYS.map((key) => {
    const index = FOOD_META[key].sources.findIndex((option) => option.key === profile.sources[key]);
    return `${profile.servings[key]}${SOURCE_LETTERS[Math.max(0, index)]}`;
  });
  return `${SHARE_PREFIX}${parts.join(".")}`;
}

export function decodeProfile(encoded: string): Profile | null {
  if (!encoded.startsWith(SHARE_PREFIX)) return null;
  const parts = encoded.slice(SHARE_PREFIX.length).split(".");
  if (parts.length !== FOOD_KEYS.length) return null;
  const profile = cloneProfile(DEFAULT_PROFILE);
  for (let i = 0; i < FOOD_KEYS.length; i += 1) {
    const match = /^(\d{1,2})([a-f])$/.exec(parts[i]);
    if (!match) return null;
    const key = FOOD_KEYS[i];
    const option = FOOD_META[key].sources[SOURCE_LETTERS.indexOf(match[2])];
    if (!option) return null;
    profile.servings[key] = clampServings(Number(match[1]));
    profile.sources[key] = option.key;
  }
  return profile;
}

function clampServings(value: number): number {
  return Math.max(0, Math.min(MAX_SERVINGS, Math.round(value)));
}

function isSourceFor(key: FoodKey, source: string): source is SourceKey {
  return FOOD_META[key].sources.some((option) => option.key === source);
}
