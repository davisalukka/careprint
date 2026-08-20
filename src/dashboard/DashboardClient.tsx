"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildBreakdown,
  buildTrend,
  calculatePlantShare,
  calculateScore,
  cloneProfile,
  DEFAULT_PROFILE,
  FOOD_KEYS,
  FOOD_META,
  formatServing,
  makeScenarios,
  scoreLabel,
  updateProfile,
  type FoodKey,
  type Profile,
  type Scenario,
  type SourceKey,
} from "../lib/footprint-model";
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

// Autosave target for the demo session. Nothing leaves the browser.
const STORAGE_KEY = "careprint:profile";

export function DashboardClient({ user, demoMode = false }: { user: User; demoMode?: boolean }) {
  const [profile, setProfile] = useState<Profile>(cloneProfile(DEFAULT_PROFILE));
  const [loaded, setLoaded] = useState(demoMode);
  const [syncState, setSyncState] = useState<SyncState>(demoMode ? "saved" : "loading");
  const [preview, setPreview] = useState<Scenario | null>(null);
  const [view, setView] = useState<ViewKey>("overview");

  const score = useMemo(() => calculateScore(profile), [profile]);
  const plantShare = useMemo(() => calculatePlantShare(profile), [profile]);
  const scenarios = useMemo(() => makeScenarios(profile), [profile]);
  const breakdown = useMemo(() => buildBreakdown(profile), [profile]);
  const trend = useMemo(() => buildTrend(profile), [profile]);
  const previewScore = preview ? calculateScore(preview.profile) : score;
  const previewDelta = score - previewScore;
  const bestNextScore = scenarios.length ? calculateScore(scenarios[0].profile) : score;

  useEffect(() => {
    const stored = readStoredProfile();
    if (stored) setProfile(stored);
    setLoaded(true);
    setSyncState("saved");
  }, []);

  useEffect(() => {
    if (!loaded || syncState !== "dirty") return;
    const timer = window.setTimeout(() => { persistProfile(profile, setSyncState); }, 850);
    return () => window.clearTimeout(timer);
  }, [profile, loaded, syncState]);

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

  function applyScenario(scenario: Scenario) {
    setProfile(cloneProfile(scenario.profile));
    setPreview(null);
    setSyncState("dirty");
    setView("overview");
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
      detail: scenario.cost,
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
              <div className="card-topline"><div><span className="label-caps">THIS WEEK’S ESTIMATE</span><h2 id="score-heading">Your cruelty footprint</h2></div><span className="status-pill status-pill-sage"><span /> {preview ? "Preview" : "On track"}</span></div>
              <div className="score-card-layout">
                <FootprintVisual profile={preview ? preview.profile : profile} />
                <div className="score-story">
                  {preview ? <p className="scenario-label">Maneuver preview · {previewDelta > 0 ? `−${previewDelta} points` : "no change"}</p> : null}
                  <h3>{preview ? preview.title : scoreLabel(score)}</h3>
                  <p>{preview ? preview.description : "Most of this number is habit, not identity. Change how often one choice shows up—no perfection required—and the score follows."}</p>
                  {preview ? <button className="text-link" onClick={() => setPreview(null)}>Reset preview ↺</button> : <span className="status-pill status-pill-sage"><span /> {plantShare}% plant-forward</span>}
                </div>
              </div>
            </section>
            <section className="dashboard-card stats-card" aria-label="Weekly summary">
              <div className="stat-block"><span className="label-caps">BEST NEXT MOVE</span><div className="stat-number"><strong>−{Math.max(0, score - bestNextScore)}</strong><span>points</span></div><p className="stat-detail"><strong>{scenarios[0]?.title ?? "Tune your baseline"}</strong><br />Run it for one week, then decide if it stays.</p></div>
              <div className="stat-block"><span className="label-caps">PLANT-FORWARD</span><div className="stat-number"><strong>{plantShare}%</strong><span>of choices</span></div><p className="stat-detail">Every plant-based pick counts here—not just the meals you skipped.</p><div className="mini-bars" aria-hidden="true"><span /><span /><span /><span /><span /></div></div>
            </section>
          </div>

          <section className="dashboard-card section-card" id="switch-lab" aria-labelledby="maneuver-heading">
            <div className="section-card-heading"><div><span className="label-caps">LOWEST-HANGING FRUIT</span><h2 id="maneuver-heading">Try a maneuver</h2></div><p>Each maneuver is one concrete change to one week. Preview it against your current pattern; apply it only when it feels livable.</p></div>
            <div className="maneuver-list">{scenarios.map((scenario) => { const delta = score - calculateScore(scenario.profile); const selected = preview?.id === scenario.id; return <div className="maneuver-item" key={scenario.id}><div className={`maneuver-icon ${scenario.tone === "coral" ? "coral" : scenario.tone === "yellow" ? "yellow" : ""}`}>{scenario.icon}</div><div className="maneuver-copy"><strong>{scenario.title}</strong><span>{scenario.description}</span></div><div className={`maneuver-delta ${delta <= 0 ? "is-done" : ""}`}>{delta > 0 ? `−${delta} pts` : "Already in place"}</div><div className="maneuver-cost">{scenario.cost}</div><div className="maneuver-actions"><button className="maneuver-button" type="button" onClick={() => setPreview(selected ? null : scenario)} aria-pressed={selected}>{selected ? "Selected" : "Preview →"}</button>{selected ? <button className="maneuver-apply-button" type="button" onClick={() => applyScenario(scenario)}>Apply & save</button> : null}</div></div>; })}</div>
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
          description="Everything below is drawn from your current local baseline. The trend is simulated for now—clearly labeled, and retired the day real weekly check-ins arrive."
        />
      ) : null}

      {view === "baseline" ? (
        <>
          <div className="baseline-grid">
          <section className="dashboard-card profile-card baseline-card" aria-labelledby="profile-heading">
            <div><span className="label-caps">YOUR BASELINE</span><h2 id="profile-heading">What’s in a normal week?</h2><p>These four inputs drive the whole estimate. Describe the week you actually have—not the one you’re aiming for—and save it when it feels fair.</p></div>
            <div className="baseline-summary"><span><strong>{score}</strong><small>current score</small></span><span><strong>{plantShare}%</strong><small>plant-forward</small></span><span><strong>{FOOD_KEYS.reduce((total, key) => total + profile.servings[key], 0)}</strong><small>tracked choices</small></span></div>
            {FOOD_KEYS.map((key) => { const meta = FOOD_META[key]; return <div className="profile-row" key={key}><div className="profile-label"><strong>{meta.label}</strong><span>{formatServing(profile.servings[key], meta.unit.split(" ")[0])}</span></div><div className="profile-control"><label className="sr-only" htmlFor={`${key}-servings`}>{meta.label} {meta.unit}</label><input id={`${key}-servings`} type="range" min="0" max="3" step="1" value={profile.servings[key]} onChange={(event) => changeServing(key, Number(event.target.value))} /><output htmlFor={`${key}-servings`}>{profile.servings[key]}</output></div><label className="sr-only" htmlFor={`${key}-source`}>{meta.label} source</label><select id={`${key}-source`} className="profile-select" value={profile.sources[key]} onChange={(event) => changeSource(key, event.target.value as SourceKey)}>{meta.sources.map((source) => <option key={source.key} value={source.key}>{source.label}</option>)}</select></div>; })}
            <button className="button button-primary button-wide" type="button" onClick={() => persistProfile(profile, setSyncState)}>Save my baseline</button>
            <p className="save-note">{demoMode ? "The demo saves to this browser only. Clear your site data and the slate wipes clean." : "Your estimate is private to your account. Vendor links are labeled so you can decide whether they’re useful."}</p>
          </section>
          <aside className="dashboard-card baseline-visual-card" aria-labelledby="living-print-heading">
            <span className="label-caps">YOUR LIVING CAREPRINT</span>
            <h2 id="living-print-heading">Watch it respond.</h2>
            <p>This is your week, drawn live. Each lobe is one cruelty vector—it swells and quickens as pressure rises, settles as your sourcing gets kinder, and drops to a seed when a choice goes plant-based. Think of it as gardening: you’re growing a smaller, calmer print.</p>
            <FootprintVisual profile={profile} showLegend />
          </aside>
          </div>
          <section className="dashboard-card section-card method-card" id="method" aria-labelledby="method-heading"><div className="method-copy"><span className="label-caps">THE METHOD, IN PLAIN ENGLISH</span><h2 id="method-heading">A transparent estimate beats a magic number.</h2><p>Careprint multiplies how often a choice shows up by a directional welfare signal for its source. That’s the entire model—every chart and forecast on this page is another view of the same arithmetic, so nothing here can surprise you.</p></div><div className="method-formula"><div className="formula-line"><span>frequency</span> × <span>welfare signal</span> = <strong>weekly estimate</strong></div><div className="formula-line"><span>your baseline</span> − <span>one maneuver</span> = <strong>new estimate</strong></div><p className="formula-caption">Lower is kinder. No vendor can pay to change the math. This is an educational estimate, not a certification or a complete measure of animal suffering.</p></div></section>
        </>
      ) : null}
    </>
  );
}

function persistProfile(profile: Profile, setSyncState: (state: SyncState) => void) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSyncState("saved");
  } catch {
    // Private-mode browsers can reject writes; the session still works in memory.
    setSyncState("error");
  }
}

function readStoredProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    if (!parsed?.servings || !parsed?.sources) return null;
    return {
      servings: { ...DEFAULT_PROFILE.servings, ...parsed.servings },
      sources: { ...DEFAULT_PROFILE.sources, ...parsed.sources },
    };
  } catch {
    return null;
  }
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
  if (key === "beef") return "coral";
  if (key === "salmon") return "sage";
  if (key === "eggs") return "yellow";
  return "mint";
}
