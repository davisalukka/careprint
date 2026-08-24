"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildBreakdown,
  calculatePlantShare,
  calculateScore,
  cloneProfile,
  decodeProfile,
  DEFAULT_PROFILE,
  EFFORT_META,
  FOOD_KEYS,
  FOOD_META,
  formatServing,
  makeScenarios,
  MAX_SERVINGS,
  normalizeProfile,
  PRESETS,
  recordCheckIn,
  scoreBand,
  scoreLabel,
  updateProfile,
  type CheckIn,
  type FoodKey,
  type Profile,
  type Scenario,
  type SourceKey,
} from "../lib/footprint-model";
import { listMarketplaceOffers } from "../lib/integration-stubs";
import { METHODOLOGY_PATH } from "../paths";
import { FootprintVisual } from "./FootprintVisual";
import styles from "./StreamlinedDashboard.module.css";

const STORAGE_KEY = "careprint:profile";
const CHECKIN_KEY = "careprint:checkins";

const FOOD_ICONS: Record<FoodKey, string> = {
  chicken: "🍗",
  beef: "🥩",
  pork: "🥓",
  salmon: "🐟",
  eggs: "🥚",
  milk: "🥛",
};

const FOOD_COLORS: Record<FoodKey, string> = {
  chicken: "var(--yellow)",
  beef: "var(--coral)",
  pork: "#d9777f",
  salmon: "#68a0a6",
  eggs: "#f3c74d",
  milk: "#88b795",
};

export function StreamlinedDashboard({
  demoMode = false,
}: {
  user?: { userId: string; displayName: string; email: string };
  demoMode?: boolean;
}) {
  const [profile, setProfile] = useState<Profile>(cloneProfile(DEFAULT_PROFILE));
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loaded, setLoaded] = useState(demoMode);
  const [syncState, setSyncState] = useState<"loading" | "saved" | "dirty">("saved");
  const [preview, setPreview] = useState<Scenario | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const activeProfile = preview ? preview.profile : profile;
  const score = useMemo(() => calculateScore(profile), [profile]);
  const previewScore = useMemo(() => calculateScore(activeProfile), [activeProfile]);
  const band = useMemo(() => scoreBand(activeProfile), [activeProfile]);
  const plantShare = useMemo(() => calculatePlantShare(activeProfile), [activeProfile]);
  const scenarios = useMemo(() => makeScenarios(profile), [profile]);
  const breakdown = useMemo(() => buildBreakdown(activeProfile), [activeProfile]);
  const topScenario = scenarios[0] ?? null;
  const scoreDelta = score - previewScore;

  // Initialize from storage or share hash
  useEffect(() => {
    const match = /^#p=(.+)$/.exec(window.location.hash);
    if (match) {
      const shared = decodeProfile(decodeURIComponent(match[1]));
      if (shared) setProfile(shared);
    } else {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) setProfile(normalizeProfile(JSON.parse(stored)));
      } catch {
        // Fallback to default
      }
    }
    try {
      const storedChecks = window.localStorage.getItem(CHECKIN_KEY);
      if (storedChecks) setCheckIns(JSON.parse(storedChecks));
    } catch {
      // Fallback
    }
    setLoaded(true);
  }, []);

  // Autosave when dirty
  useEffect(() => {
    if (!loaded || syncState !== "dirty") return;
    const timer = window.setTimeout(() => {
      saveProfile(profile);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [profile, loaded, syncState]);

  function saveProfile(nextProfile: Profile) {
    const nextScore = calculateScore(nextProfile);
    const nextChecks = recordCheckIn(checkIns, nextScore);
    setCheckIns(nextChecks);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
      window.localStorage.setItem(CHECKIN_KEY, JSON.stringify(nextChecks));
      setSyncState("saved");
    } catch {
      // Ignore in private mode
    }
  }

  function handleServingChange(key: FoodKey, servings: number) {
    const safe = Math.max(0, Math.min(MAX_SERVINGS, servings));
    setProfile((prev) => updateProfile(prev, key, { servings: safe }));
    setPreview(null);
    setSyncState("dirty");
  }

  function handleSourceChange(key: FoodKey, source: SourceKey) {
    setProfile((prev) => updateProfile(prev, key, { source }));
    setPreview(null);
    setSyncState("dirty");
  }

  function applyPreset(presetProfile: Profile) {
    setProfile(cloneProfile(presetProfile));
    setPreview(null);
    setSyncState("dirty");
  }

  function applyScenario(scenario: Scenario) {
    setProfile(cloneProfile(scenario.profile));
    setPreview(null);
    setSyncState("dirty");
  }

  function exportJSON() {
    const payload = JSON.stringify({ version: 2, profile, checkIns }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "careprint-baseline.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { profile?: unknown };
        setProfile(normalizeProfile(parsed.profile ?? parsed));
        setPreview(null);
        setSyncState("dirty");
      } catch {
        // Invalid file
      }
    };
    reader.readAsText(file);
  }

  // Find contextual vendor matching the top or previewed move
  const contextualVendor = useMemo(() => {
    const offers = listMarketplaceOffers();
    if (!topScenario) return offers[0];
    if (topScenario.id.includes("salmon") || topScenario.id.includes("fish"))
      return offers.find((o) => o.id === "northern-raised") ?? offers[0];
    if (topScenario.id.includes("pork") || topScenario.id.includes("beef"))
      return offers.find((o) => o.id === "west-side-beef") ?? offers[0];
    return offers.find((o) => o.id === "rowe-farms") ?? offers[0];
  }, [topScenario]);

  const maxBreakdownValue = Math.max(1, ...breakdown.map((b) => b.value));

  return (
    <div className={styles.streamlinedShell}>
      {/* Top Presets & Controls */}
      <section className={styles.topBar} aria-label="Presets and Quick Controls">
        <div className={styles.presetGroup}>
          <span className={styles.presetLabel}>Presets:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={styles.presetPill}
              onClick={() => applyPreset(preset.profile)}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className={styles.topActions}>
          <span className={styles.syncBadge}>
            <span className={styles.syncDot} />
            {syncState === "dirty" ? "Saving…" : demoMode ? "Local Demo" : "Saved"}
          </span>
          <button type="button" className={styles.actionBtn} onClick={exportJSON}>
            Export
          </button>
          <button type="button" className={styles.actionBtn} onClick={() => importInputRef.current?.click()}>
            Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importJSON(file);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      {/* Main 2-Column Split */}
      <div className={styles.mainWorkspace}>
        {/* Left Panel: Compact Food Baseline Inputs */}
        <section className={styles.inputSection} aria-label="Your Typical Weekly Food Baseline">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Weekly Baseline</h2>
            <span className={styles.sectionSubtitle}>Adjust frequency & sourcing</span>
          </div>

          <div className={styles.foodCardList}>
            {FOOD_KEYS.map((key) => {
              const meta = FOOD_META[key];
              const servings = profile.servings[key];
              const currentSource = profile.sources[key];
              const unitShort = meta.unit.split(" ")[0];

              return (
                <div className={styles.foodCard} key={key}>
                  <div className={styles.foodCardTop}>
                    <div className={styles.foodMeta}>
                      <span className={styles.foodIcon}>{FOOD_ICONS[key]}</span>
                      <div className={styles.foodLabelGroup}>
                        <strong>{meta.label}</strong>
                        <span>{formatServing(servings, unitShort)}</span>
                      </div>
                    </div>

                    <div className={styles.servingControls}>
                      <button
                        type="button"
                        className={styles.stepperBtn}
                        onClick={() => handleServingChange(key, servings - 1)}
                        aria-label={`Decrease ${meta.label} servings`}
                      >
                        −
                      </button>
                      <input
                        type="range"
                        min="0"
                        max={MAX_SERVINGS}
                        step="1"
                        value={servings}
                        className={styles.rangeSlider}
                        onChange={(e) => handleServingChange(key, Number(e.target.value))}
                        aria-label={`${meta.label} servings per week`}
                      />
                      <button
                        type="button"
                        className={styles.stepperBtn}
                        onClick={() => handleServingChange(key, servings + 1)}
                        aria-label={`Increase ${meta.label} servings`}
                      >
                        +
                      </button>
                      <span className={styles.servingBadge}>{servings} {unitShort}</span>
                    </div>
                  </div>

                  {/* Segmented Source Selector */}
                  <div className={styles.sourceSegmented} role="group" aria-label={`${meta.label} sourcing`}>
                    {meta.sources.map((src) => {
                      const isSelected = currentSource === src.key;
                      return (
                        <button
                          key={src.key}
                          type="button"
                          className={`${styles.sourceOption} ${isSelected ? styles.sourceOptionSelected : ""}`}
                          onClick={() => handleSourceChange(key, src.key as SourceKey)}
                          title={`${src.label} (${src.points} pts)`}
                        >
                          {src.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Panel: Sticky Live Visual & Next Move */}
        <aside className={styles.livePanel} aria-label="Live Welfare Footprint & Next Moves">
          {/* Main Visual & Score Card */}
          <div className={styles.visualCard}>
            {preview ? (
              <div className={styles.previewBanner}>
                <span>
                  Previewing move: <strong>−{scoreDelta} pts</strong>
                </span>
                <button type="button" className={styles.resetPreviewBtn} onClick={() => setPreview(null)}>
                  Reset ↺
                </button>
              </div>
            ) : null}

            <div className={styles.visualContainer}>
              <FootprintVisual profile={activeProfile} />
            </div>

            <div className={styles.scorePillsRow}>
              <div className={styles.scorePill}>
                <strong>{previewScore} / 100</strong>
                <span>{scoreLabel(previewScore)}</span>
              </div>
              <div className={styles.scorePill}>
                <strong>{plantShare}%</strong>
                <span>Plant-forward</span>
              </div>
              <div className={styles.scorePill}>
                <strong>{band.low}–{band.high}</strong>
                <span>Directional band</span>
              </div>
            </div>
          </div>

          {/* Best Next Move Spotlight */}
          {topScenario ? (
            <div className={styles.leverSpotlight}>
              <div className={styles.leverTop}>
                <span className={styles.leverHeader}>⭐ Lowest-Hanging Fruit</span>
                <span className={styles.leverDelta}>
                  −{score - calculateScore(topScenario.profile)} pts
                </span>
              </div>

              <div className={styles.leverContent}>
                <h3 className={styles.leverTitle}>{topScenario.title}</h3>
                <p className={styles.leverDesc}>{topScenario.description}</p>
              </div>

              <div className={styles.leverActions}>
                <button
                  type="button"
                  className={`${styles.previewBtn} ${preview?.id === topScenario.id ? styles.previewBtnActive : ""}`}
                  onClick={() => setPreview(preview?.id === topScenario.id ? null : topScenario)}
                >
                  {preview?.id === topScenario.id ? "Previewing" : "Preview move →"}
                </button>
                {preview?.id === topScenario.id ? (
                  <button
                    type="button"
                    className={styles.applyBtn}
                    onClick={() => applyScenario(topScenario)}
                  >
                    Apply & Save
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Contextual Verified Sourcing */}
          {contextualVendor ? (
            <div className={styles.contextualVendor}>
              <div className={styles.vendorInfo}>
                <strong>{contextualVendor.name}</strong>
                <span>{contextualVendor.detail}</span>
              </div>
              <span className={styles.vendorTag}>{contextualVendor.tag}</span>
            </div>
          ) : null}
        </aside>
      </div>

      {/* Collapsible Deeper Analytics & Breakdown Drawer */}
      <section className={styles.drawerSection} aria-label="Detailed breakdown and trends">
        <button
          type="button"
          className={styles.drawerToggle}
          onClick={() => setShowDeepDive((prev) => !prev)}
          aria-expanded={showDeepDive}
        >
          <span>📊 View Footprint Breakdown & Methodology</span>
          <span>{showDeepDive ? "▲ Collapse" : "▼ Expand"}</span>
        </button>

        {showDeepDive ? (
          <div className={styles.drawerBody}>
            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>
                Estimated Points by Food
              </h4>
              <div className={styles.breakdownGrid}>
                {breakdown.map((item) => {
                  const widthPercent = (item.value / maxBreakdownValue) * 100;
                  return (
                    <div className={styles.breakdownRow} key={item.key}>
                      <div className={styles.breakdownHeader}>
                        <span>{item.label}</span>
                        <strong>{item.value} pts</strong>
                      </div>
                      <div className={styles.breakdownTrack}>
                        <div
                          className={styles.breakdownFill}
                          style={{
                            width: `${widthPercent}%`,
                            background: FOOD_COLORS[item.key] || "var(--sage)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>
                How the Score Works
              </h4>
              <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5, margin: "0 0 12px" }}>
                Each food item's welfare score is calculated by multiplying its weekly frequency by a
                verifiable welfare impact coefficient based on housing, transport, and slaughter standards.
              </p>
              <div className={styles.methodFootnote}>
                <a href={METHODOLOGY_PATH}>Read complete methodology & research weights ↗</a>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
