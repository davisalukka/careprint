export type FoodKey = "beef" | "salmon" | "eggs" | "milk";
export type SourceKey = "standard" | "pasture" | "plant" | "oceanwise" | "local";

export type Profile = {
  servings: Record<FoodKey, number>;
  sources: Record<FoodKey, SourceKey>;
};

export type SourceOption = { key: SourceKey; label: string; points: number };
export type FoodMeta = { label: string; unit: string; icon: string; sources: SourceOption[] };

export type Scenario = {
  id: string;
  title: string;
  description: string;
  cost: string;
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

export const FOOD_KEYS: FoodKey[] = ["beef", "salmon", "eggs", "milk"];

export const FOOD_META: Record<FoodKey, FoodMeta> = {
  beef: {
    label: "Beef", unit: "servings / week", icon: "✦",
    sources: [
      { key: "standard", label: "Conventional", points: 24 },
      { key: "pasture", label: "Pasture-raised", points: 13 },
      { key: "plant", label: "Plant-based swap", points: 0 },
    ],
  },
  salmon: {
    label: "Salmon", unit: "servings / week", icon: "≈",
    sources: [
      { key: "standard", label: "Standard / unknown", points: 17 },
      { key: "oceanwise", label: "Ocean-aware choice", points: 11 },
      { key: "plant", label: "Plant-based swap", points: 0 },
    ],
  },
  eggs: {
    label: "Eggs", unit: "dozens / week", icon: "○",
    sources: [
      { key: "standard", label: "Cage-free / unknown", points: 12 },
      { key: "pasture", label: "Pasture-raised", points: 6 },
      { key: "plant", label: "Plant-based swap", points: 0 },
    ],
  },
  milk: {
    label: "Milk", unit: "litres / week", icon: "⌁",
    sources: [
      { key: "standard", label: "Standard / unknown", points: 8 },
      { key: "local", label: "Local / higher-welfare", points: 5 },
      { key: "plant", label: "Plant-based swap", points: 0 },
    ],
  },
};

export const DEFAULT_PROFILE: Profile = {
  servings: { beef: 1, salmon: 1, eggs: 1, milk: 1 },
  sources: { beef: "pasture", salmon: "oceanwise", eggs: "pasture", milk: "local" },
};

export function cloneProfile(profile: Profile): Profile {
  return { servings: { ...profile.servings }, sources: { ...profile.sources } };
}

export function updateProfile(profile: Profile, key: FoodKey, changes: { servings?: number; source?: SourceKey }): Profile {
  const next = cloneProfile(profile);
  if (typeof changes.servings === "number") next.servings[key] = Math.max(0, Math.min(3, changes.servings));
  if (changes.source) next.sources[key] = changes.source;
  return next;
}

export function pointsFor(key: FoodKey, source: SourceKey): number {
  return FOOD_META[key].sources.find((option) => option.key === source)?.points ?? 0;
}

export function calculateScore(profile: Profile): number {
  const rawScore = FOOD_KEYS.reduce((total, key) => total + profile.servings[key] * pointsFor(key, profile.sources[key]), 0);
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

export function calculatePlantShare(profile: Profile): number {
  const weeklyAnimalChoices = FOOD_KEYS.reduce((total, key) => total + (profile.sources[key] === "plant" ? 0 : profile.servings[key]), 0);
  return Math.max(0, Math.min(100, Math.round((1 - Math.min(21, weeklyAnimalChoices) / 21) * 100)));
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

export function makeScenarios(profile: Profile): Scenario[] {
  const beefLess = cloneProfile(profile);
  beefLess.servings.beef = Math.max(0, beefLess.servings.beef - 1);
  const salmonLess = cloneProfile(profile);
  salmonLess.servings.salmon = Math.max(0, salmonLess.servings.salmon - 1);
  const milkPlant = cloneProfile(profile);
  milkPlant.sources.milk = "plant";
  const eggMove = cloneProfile(profile);
  const eggsAlreadyPasture = profile.sources.eggs === "pasture";
  if (eggsAlreadyPasture) eggMove.servings.eggs = Math.max(0, eggMove.servings.eggs - 1);
  else eggMove.sources.eggs = "pasture";

  // Annotated so the literal `tone` values narrow to Scenario's union
  // instead of widening to string.
  const scenarios: Scenario[] = [
    { id: "beef-less", title: "Make beef occasional", description: "Swap one serving for beans, lentils, or tofu—the single biggest lever on the board.", cost: "Usually saves money", icon: "✦", tone: "coral", profile: beefLess },
    { id: "salmon-less", title: "Make salmon a treat", description: "Same fish, fewer appearances. Frequency is the kindest lever here.", cost: "Usually saves money", icon: "≈", tone: "mint", profile: salmonLess },
    { id: "eggs-better", title: eggsAlreadyPasture ? "Trim a dozen eggs" : "Choose pasture-raised eggs", description: eggsAlreadyPasture ? "Your sourcing is already strong—the next lever is quantity." : "The same recipes, a meaningfully better life behind them.", cost: eggsAlreadyPasture ? "Saves a little" : "Small weekly uplift", icon: "○", tone: "yellow", profile: eggMove },
    { id: "milk-plant", title: "Make plant milk the default", description: "Save dairy for the moments where it actually matters to you.", cost: "Often costs less", icon: "⌁", tone: "mint", profile: milkPlant },
  ];

  return scenarios.sort((a, b) => calculateScore(a.profile) - calculateScore(b.profile));
}

export function buildBreakdown(profile: Profile): BreakdownPoint[] {
  const colors: Record<FoodKey, string> = { beef: "#e27352", salmon: "#6f9fa6", eggs: "#e8bd58", milk: "#8db59a" };
  return FOOD_KEYS.map((key) => ({
    key,
    label: FOOD_META[key].label,
    value: profile.servings[key] * pointsFor(key, profile.sources[key]),
    detail: `${profile.servings[key]} × ${pointsFor(key, profile.sources[key])} signal`,
    color: colors[key],
  }));
}

export function buildTrend(profile: Profile): TrendPoint[] {
  const current = calculateScore(profile);
  const change = Math.max(3, Math.round(current * 0.08));
  return [
    { label: "6w ago", score: Math.min(100, current + change * 3), note: "Baseline" },
    { label: "5w ago", score: Math.min(100, current + change * 2), note: "First swap" },
    { label: "4w ago", score: Math.min(100, current + change), note: "More plant-forward" },
    { label: "3w ago", score: Math.max(0, current + Math.round(change * 0.6)), note: "Kept the habit" },
    { label: "2w ago", score: Math.max(0, current + Math.round(change * 0.25)), note: "Sourcing upgrade" },
    { label: "This week", score: current, note: "Current estimate" },
  ];
}
