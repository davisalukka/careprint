"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { METHODOLOGY_PATH } from "../paths";
import { AnalyticsPanel, type AnalyticsTone } from "./AnalyticsPanel";
import { FootprintVisual } from "./FootprintVisual";
import { MarketplacePanel } from "./MarketplacePanel";

type User = { userId: string; displayName: string; email: string };
type ViewKey = "overview" | "analytics" | "baseline";
type SyncState = "loading" | "saved" | "dirty" | "error";

const VIEW_OPTIONS: Array<{ id: ViewKey; label: string; helper: string }> = [
  { id: "overview", label: "Overview", helper: "Your next move" },
  { id: "analytics", label: "Analytics", helper: "Charts + trends" },
  { id: "baseline", label: "Baseline", helper: "Tune your inputs" },
];

// Autosave targets for the demo session. Nothing leaves the browser.
const STORAGE_KEY = "careprint:profile";
const CHECKIN_KEY = "careprint:checkins";

export function DashboardClient({ user, demoMode = false }: { user: User; demoMode?: boolean }) {
  const [profile, setProfile] = useState<Profile>(cloneProfile(DEFAULT_PROFILE));
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loaded, setLoaded] = useState(demoMode);
  const [syncState, setSyncState] = useState<SyncState>(demoMode ? "saved" : "loading");
  const [preview, setPreview] = useState<Scenario | null>(null);
  const [view, setView] = useState<ViewKey>("overview");
  const [fromShare, setFromShare] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "manual">("idle");
  const importInputRef = useRef<HTMLInputElement>(null);

  const score = useMemo(() => calculateScore(profile), [profile]);
  const band = useMemo(() => scoreBand(profile), [profile]);
  const plantShare = useMemo(() => calculatePlantShare(profile), [profile]);
  const scenarios = useMemo(() => makeScenarios(profile), [profile]);
  const breakdown = useMemo(() => buildBreakdown(profile), [profile]);
  const trend = useMemo(() => buildTrend(checkIns), [checkIns]);
  const previewScore = preview ? calculateScore(preview.profile) : score;
  const previewDelta = score - previewScore;
  const bestNextScore = scenarios.length ? calculateScore(scenarios[0].profile) : score;

  useEffect(() => {
    const shared = readSharedProfile();
    if (shared) {
      setProfile(shared);
      setFromShare(true);
      setSyncState("saved");
    } else {
      const stored = readStoredProfile();
      if (stored) setProfile(stored);
      setSyncState("saved");
    }
    setCheckIns(readStoredCheckIns());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || syncState !== "dirty") return;
    const timer = window.setTimeout(() => { save(profile); }, 850);
    return () => window.clearTimeout(timer);
  }, [profile, loaded, syncState]);

  function save(profileToSave: Profile) {
    const nextCheckIns = recordCheckIn(checkIns, calculateScore(profileToSave));
    setCheckIns(nextCheckIns);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profileToSave));
      window.localStorage.setItem(CHECKIN_KEY, JSON.stringify(nextCheckIns));
      setSyncState("saved");
    } catch {
      // Private-mode browsers can reject writes; the session still works in memory.
      setSyncState("error");
    }
  }

  function changeServing(key: FoodKey, value: number) {
    setProfile((current) => updateProfile(current, key, { servings: value }));
    setPreview(null);
    setSyncState("dirty");
  }

  function changeSource(key: FoodKey, value: SourceKey) {
    setProfile((current) => updateProfile(current, key, { source: value }));
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
    setView("overview");
  }

  async function shareProfile() {
    const url = `${window.location.origin}${window.location.pathname}#p=${encodeProfile(profile)}`;
    window.history.replaceState(null, "", `#p=${encodeProfile(profile)}`);
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch {
      setShareState("manual");
    }
    window.setTimeout(() => setShareState("idle"), 2400);
  }

  function exportProfile() {
    const payload = JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), profile, checkIns }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "careprint-baseline.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importProfile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { profile?: unknown; checkIns?: unknown };
        setProfile(normalizeProfile(parsed.profile ?? parsed));
        if (Array.isArray(parsed.checkIns)) {
          setCheckIns(parsed.checkIns.filter((entry): entry is CheckIn =>
            typeof entry === "object" && entry !== null &&
            typeof (entry as CheckIn).week === "string" && typeof (entry as CheckIn).score === "number"));
        }
        setPreview(null);
        setSyncState("dirty");
      } catch {
        setSyncState("error");
      }
    };
    reader.readAsText(file);
  }

  const analyticsBreakdown = breakdown.map((item) => ({
    id: item.key,
    label: item.label,
    value: item.value,
    helper: item.detail,
    tone: toneForFood(item.key),
  }));
  const analyticsTrend = trend.map((point) => ({ id: point.label, label: point.label, value: point.score, helper: point.note }));
  const analyticsScenarios = scenarios.map((scenario) => {
    // Annotated so the ternary narrows to AnalyticsTone rather than string.
    const tone: AnalyticsTone =
      scenario.tone === "coral" ? "coral" : scenario.tone === "yellow" ? "yellow" : "mint";
    return {
      id: scenario.id,
      label: scenario.title,
      score: calculateScore(scenario.profile),
      description: scenario.description,
      detail: `${EFFORT_META[scenario.effort].icon} ${EFFORT_META[scenario.effort].label}`,
      tone,
    };
  });

  return (
    <>
      <section className="dashboard-welcome" id="overview">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> {demoMode ? "Interactive demo" : "Your private estimate"}</p>
          <h1>{greeting()}, {firstName(user.displayName)}.</h1>
          <p>{demoMode ? "Every dial here is live, and nothing leaves this browser. Poke around—there’s nothing you can break." : "Here’s the one move that would make this week kinder than the last."}</p>
        </div>
        <div className={`sync-status ${syncState === "saved" ? "is-saved" : ""} ${syncState === "error" ? "is-error" : ""}`}>
          {syncState === "loading" && "Loading your profile…"}
          {syncState === "saved" && (demoMode ? "Demo mode · local only" : "Saved to your account")}
          {syncState === "dirty" && "Saving your changes…"}
          {syncState === "error" && "Draft mode · changes held in memory only"}
        </div>
      </section>

      {fromShare ? <div className="demo-banner"><span>↗</span><strong>Viewing a shared careprint</strong><span>Someone sent you their week. Edit anything or save it to make it yours.</span></div> : null}
      {demoMode ? <div className="demo-banner"><span>◎</span><strong>Stubbed integration mode</strong><span>Sign-in, partner clicks, inventory, and saving all run on local stand-ins—the full product shell, with nothing plugged into the wall.</span></div> : null}

      <div className="dashboard-view-tabs" role="tablist" aria-label="Dashboard views">
        {VIEW_OPTIONS.map((option) => (
          <button className={`dashboard-view-tab ${view === option.id ? "is-active" : ""}`} key={option.id} type="button" role="tab" aria-selected={view === option.id} onClick={() => setView(option.id)}>
            <strong>{option.label}</strong><span>{option.helper}</span>
          </button>
        ))}
      </div>

      {view === "overview" ? (
        <>
          <div className="dashboard-grid">
            <section className="dashboard-card score-card" aria-labelledby="score-heading">
              <div className="card-topline"><div><span className="label-caps">THIS WEEK’S ESTIMATE</span><h2 id="score-heading">Your welfare footprint</h2></div><span className="status-pill status-pill-sage"><span /> {preview ? "Preview" : "On track"}</span></div>
              <div className="score-card-layout">
                <FootprintVisual profile={preview ? preview.profile : profile} />
                <div className="score-story">
                  {preview ? <p className="scenario-label">Maneuver preview · {previewDelta > 0 ? `−${previewDelta} points` : "no change"}</p> : null}
                  <h3>{preview ? preview.title : scoreLabel(score)}</h3>
                  <p>{preview ? preview.description : "Most of this number is habit, not identity. Change how often one choice shows up—no perfection required—and the score follows."}</p>
                  {preview ? <button className="text-link" onClick={() => setPreview(null)}>Reset preview ↺</button> : <span className="status-pill status-pill-sage"><span /> {plantShare}% plant-forward</span>}
                  <p className="score-band-note">Directional band {band.low}–{band.high} · <a href={METHODOLOGY_PATH}>see the method ↗</a></p>
                </div>
              </div>
            </section>
            <section className="dashboard-card stats-card" aria-label="Weekly summary">
              <div className="stat-block"><span className="label-caps">BEST NEXT MOVE</span><div className="stat-number"><strong>−{Math.max(0, score - bestNextScore)}</strong><span>points</span></div><p className="stat-detail"><strong>{scenarios[0]?.title ?? "Tune your baseline"}</strong><br />Run it for one week, then decide if it stays.</p></div>
              <div className="stat-block"><span className="label-caps">PLANT-FORWARD</span><div className="stat-number"><strong>{plantShare}%</strong><span>of choices</span></div><p className="stat-detail">Every plant-based pick counts here—not just the meals you skipped.</p><div className="mini-bars" aria-hidden="true"><span /><span /><span /><span /><span /></div></div>
            </section>
          </div>

          <section className="dashboard-card section-card" id="switch-lab" aria-labelledby="maneuver-heading">
            <div className="section-card-heading"><div><span className="label-caps">RANKED BY IMPACT × EASE</span><h2 id="maneuver-heading">Try a maneuver</h2></div><p>Each maneuver is one concrete change to one week, ranked by welfare gain per unit of effort. Preview it against your current pattern; apply it only when it feels livable.</p></div>
            {scenarios.length ? (
              <div className="maneuver-list">{scenarios.map((scenario) => { const delta = score - calculateScore(scenario.profile); const selected = preview?.id === scenario.id; const effort = EFFORT_META[scenario.effort]; return <div className="maneuver-item" key={scenario.id}><div className={`maneuver-icon ${scenario.tone === "coral" ? "coral" : scenario.tone === "yellow" ? "yellow" : ""}`}>{scenario.icon}</div><div className="maneuver-copy"><strong>{scenario.title}</strong><span>{scenario.description}</span></div><div className={`maneuver-delta ${delta <= 0 ? "is-done" : ""}`}>{delta > 0 ? `−${delta} pts` : "Already in place"}</div><div className="maneuver-cost"><span aria-hidden="true">{effort.icon}</span> {effort.label}</div><div className="maneuver-actions"><button className="maneuver-button" type="button" onClick={() => setPreview(selected ? null : scenario)} aria-pressed={selected}>{selected ? "Selected" : "Preview →"}</button>{selected ? <button className="maneuver-apply-button" type="button" onClick={() => applyScenario(scenario)}>Apply & save</button> : null}</div></div>; })}</div>
            ) : (
              <p className="maneuver-empty">Your baseline is already about as kind as this model can measure. Check back after your next weekly check-in.</p>
            )}
          </section>

          <MarketplacePanel demoMode={demoMode} />
        </>
      ) : null}

      {view === "analytics" ? (
        <AnalyticsPanel
          score={score}
          scoreLabel={scoreLabel(score)}
          forecast={{ score: bestNextScore, label: "If you take your best next move", period: "NEXT WEEK", description: "A preview, not a promise—the score only moves when you apply a maneuver to your baseline." }}
          breakdown={analyticsBreakdown}
          weeklyTrend={analyticsTrend}
          scenarios={analyticsScenarios}
          title="See the pattern, then choose the lever."
          description="Everything below is drawn from your current local baseline. The trend is your own saved check-ins—one snapshot per week, stored in this browser."
        />
      ) : null}

      {view === "baseline" ? (
        <>
          <div className="baseline-grid">
          <section className="dashboard-card profile-card baseline-card" aria-labelledby="profile-heading">
            <div><span className="label-caps">YOUR BASELINE</span><h2 id="profile-heading">What’s in a normal week?</h2><p>These six inputs drive the whole estimate. Describe the week you actually have—not the one you’re aiming for—and save it when it feels fair.</p></div>
            <div className="preset-row" role="group" aria-label="Baseline presets">
              <span className="label-caps">START FROM A PRESET</span>
              <div className="preset-chips">{PRESETS.map((preset) => <button className="preset-chip" key={preset.key} type="button" title={preset.description} onClick={() => applyPreset(preset.profile)}>{preset.label}</button>)}</div>
            </div>
            <div className="baseline-summary"><span><strong>{score}</strong><small>current score</small></span><span><strong>{band.low}–{band.high}</strong><small>directional band</small></span><span><strong>{plantShare}%</strong><small>plant-forward</small></span></div>
            {FOOD_KEYS.map((key) => { const meta = FOOD_META[key]; return <div className="profile-row" key={key}><div className="profile-label"><strong>{meta.label}</strong><span>{formatServing(profile.servings[key], meta.unit.split(" ")[0])}</span></div><div className="profile-control"><label className="sr-only" htmlFor={`${key}-servings`}>{meta.label} {meta.unit}</label><input id={`${key}-servings`} type="range" min="0" max={MAX_SERVINGS} step="1" value={profile.servings[key]} onChange={(event) => changeServing(key, Number(event.target.value))} /><output htmlFor={`${key}-servings`}>{profile.servings[key]}</output></div><label className="sr-only" htmlFor={`${key}-source`}>{meta.label} source</label><select id={`${key}-source`} className="profile-select" value={profile.sources[key]} onChange={(event) => changeSource(key, event.target.value as SourceKey)}>{meta.sources.map((source) => <option key={source.key} value={source.key}>{source.label}</option>)}</select></div>; })}
            <button className="button button-primary button-wide" type="button" onClick={() => save(profile)}>Save my baseline</button>
            <div className="baseline-tools">
              <button className="button button-ghost button-small" type="button" onClick={exportProfile}>Export JSON</button>
              <button className="button button-ghost button-small" type="button" onClick={() => importInputRef.current?.click()}>Import JSON</button>
              <input ref={importInputRef} className="sr-only" type="file" accept="application/json" aria-label="Import a Careprint baseline file" onChange={(event) => { const file = event.target.files?.[0]; if (file) importProfile(file); event.target.value = ""; }} />
            </div>
            <p className="save-note">{demoMode ? "The demo saves to this browser only. Export a JSON backup any time; clearing site data wipes the slate." : "Your estimate is private to your account. Vendor links are labeled so you can decide whether they’re useful."}</p>
          </section>
          <aside className="dashboard-card baseline-visual-card" aria-labelledby="living-print-heading">
            <span className="label-caps">YOUR LIVING CAREPRINT</span>
            <h2 id="living-print-heading">Watch it respond.</h2>
            <p>This is your week, drawn live. Each lobe is one welfare vector—it swells and quickens as pressure rises, settles as your sourcing gets kinder, and drops to a seed when a choice goes plant-based. Think of it as gardening: you’re growing a smaller, calmer print.</p>
            <FootprintVisual profile={profile} showLegend />
            <button className="button button-ghost button-small share-button" type="button" onClick={shareProfile}>
              {shareState === "copied" ? "Link copied ✓" : shareState === "manual" ? "Link ready in the address bar" : "Share this print ↗"}
            </button>
          </aside>
          </div>
          <section className="dashboard-card section-card method-card" id="method" aria-labelledby="method-heading"><div className="method-copy"><span className="label-caps">THE METHOD, IN PLAIN ENGLISH</span><h2 id="method-heading">A transparent estimate beats a magic number.</h2><p>Careprint multiplies how often a choice shows up by a directional welfare signal for its source. That’s the entire model—every chart and forecast on this page is another view of the same arithmetic, so nothing here can surprise you.</p><a className="text-link" href={METHODOLOGY_PATH}>Read the full methodology, weights, and sources <span aria-hidden="true">↗</span></a></div><div className="method-formula"><div className="formula-line"><span>frequency</span> × <span>welfare signal</span> = <strong>weekly estimate</strong></div><div className="formula-line"><span>your baseline</span> − <span>one maneuver</span> = <strong>new estimate</strong></div><p className="formula-caption">Lower is kinder. No vendor can pay to change the math. This is an educational estimate, not a certification or a complete measure of animal suffering.</p></div></section>
        </>
      ) : null}
    </>
  );
}

function readStoredProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // normalizeProfile migrates old v1 baselines (4 categories, 0–3 range)
    // and rejects anything malformed.
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

function readStoredCheckIns(): CheckIn[] {
  try {
    const raw = window.localStorage.getItem(CHECKIN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is CheckIn =>
      typeof entry === "object" && entry !== null &&
      typeof entry.week === "string" && typeof entry.score === "number");
  } catch {
    return [];
  }
}

function readSharedProfile(): Profile | null {
  const match = /^#p=(.+)$/.exec(window.location.hash);
  if (!match) return null;
  return decodeProfile(decodeURIComponent(match[1]));
}

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || "there";
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function toneForFood(key: FoodKey): AnalyticsTone {
  if (key === "chicken") return "ochre";
  if (key === "beef") return "coral";
  if (key === "pork") return "rose";
  if (key === "salmon") return "sage";
  if (key === "eggs") return "yellow";
  return "mint";
}
