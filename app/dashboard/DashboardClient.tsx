"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
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
import { MarketplacePanel } from "./MarketplacePanel";

type User = { userId: string; displayName: string; email: string };
type ViewKey = "overview" | "analytics" | "baseline";
type SyncState = "loading" | "saved" | "dirty" | "error";

const VIEW_OPTIONS: Array<{ id: ViewKey; label: string; helper: string }> = [
  { id: "overview", label: "Overview", helper: "Your next move" },
  { id: "analytics", label: "Analytics", helper: "Charts + trends" },
  { id: "baseline", label: "Baseline", helper: "Tune your inputs" },
];

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
    if (demoMode) return;

    let active = true;
    fetch("/api/profile")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load profile");
        return response.json() as Promise<{ profile?: Profile | null }>;
      })
      .then((payload) => {
        if (!active) return;
        if (payload.profile?.servings && payload.profile.sources) {
          setProfile({
            servings: { ...DEFAULT_PROFILE.servings, ...payload.profile.servings },
            sources: { ...DEFAULT_PROFILE.sources, ...payload.profile.sources },
          });
        }
        setLoaded(true);
        setSyncState("saved");
      })
      .catch(() => {
        if (!active) return;
        setLoaded(true);
        setSyncState("error");
      });

    return () => { active = false; };
  }, [demoMode]);

  useEffect(() => {
    if (!loaded || syncState !== "dirty") return;
    const timer = window.setTimeout(() => { void persistProfile(profile, setSyncState, demoMode); }, 850);
    return () => window.clearTimeout(timer);
  }, [profile, loaded, syncState, demoMode]);

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

  const ringStyle = { "--score-angle": `${Math.max(6, previewScore * 3.6)}deg` } as CSSProperties;

  const analyticsBreakdown = breakdown.map((item) => ({
    id: item.key,
    label: item.label,
    value: item.value,
    helper: item.detail,
    tone: toneForFood(item.key),
  }));
  const analyticsTrend = trend.map((point) => ({ id: point.label, label: point.label, value: point.score, helper: point.note }));
  const analyticsScenarios = scenarios.map((scenario) => ({
    id: scenario.id,
    label: scenario.title,
    score: calculateScore(scenario.profile),
    description: scenario.description,
    detail: scenario.cost,
    tone: scenario.tone === "coral" ? "coral" : scenario.tone === "yellow" ? "yellow" : "mint",
  }));

  return (
    <>
      <section className="dashboard-welcome" id="overview">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> {demoMode ? "Interactive demo" : "Your private estimate"}</p>
          <h1>Good morning, {firstName(user.displayName)}.</h1>
          <p>{demoMode ? "Explore every dial and view with mock data. Nothing leaves this browser session." : "Here’s the one move that would make your week meaningfully kinder."}</p>
        </div>
        <div className={`sync-status ${syncState === "saved" ? "is-saved" : ""} ${syncState === "error" ? "is-error" : ""}`}>
          {syncState === "loading" && "Loading your profile…"}
          {syncState === "saved" && (demoMode ? "Demo mode · local only" : "Saved to your account")}
          {syncState === "dirty" && "Saving your changes…"}
          {syncState === "error" && "Draft mode · database unavailable"}
        </div>
      </section>

      {demoMode ? <div className="demo-banner"><span>◎</span><strong>Stubbed integration mode</strong><span>Authentication, partner clicks, inventory, and persistence stay local until you connect real services.</span></div> : null}

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
                <div className="score-ring" style={ringStyle} aria-label={`${previewScore} out of 100 estimated welfare pressure`}><div className="score-ring-inner"><strong>{preview ? previewScore : score}</strong><span>/100</span><small>lower is kinder</small></div></div>
                <div className="score-story">
                  {preview ? <p className="scenario-label">Maneuver preview · {previewDelta > 0 ? `−${previewDelta} points` : "no change"}</p> : null}
                  <h3>{preview ? preview.title : scoreLabel(score)}</h3>
                  <p>{preview ? preview.description : "You’re already building a strong plant-forward baseline. The next leverage point is likely frequency, not perfection."}</p>
                  {preview ? <button className="text-link" onClick={() => setPreview(null)}>Reset preview ↺</button> : <span className="status-pill status-pill-sage"><span /> {plantShare}% plant-forward</span>}
                </div>
              </div>
            </section>
            <section className="dashboard-card stats-card" aria-label="Weekly summary">
              <div className="stat-block"><span className="label-caps">BEST NEXT MOVE</span><div className="stat-number"><strong>−{Math.max(0, score - bestNextScore)}</strong><span>points</span></div><p className="stat-detail"><strong>{scenarios[0]?.title ?? "Tune your baseline"}</strong><br />Try it for one week and reassess.</p></div>
              <div className="stat-block"><span className="label-caps">PLANT-FORWARD</span><div className="stat-number"><strong>{plantShare}%</strong><span>of choices</span></div><p className="stat-detail">Plant-based source selections now count as plant-forward, not just zero-quantity items.</p><div className="mini-bars" aria-hidden="true"><span /><span /><span /><span /><span /></div></div>
            </section>
          </div>

          <section className="dashboard-card section-card" id="switch-lab" aria-labelledby="maneuver-heading">
            <div className="section-card-heading"><div><span className="label-caps">LOWEST-HANGING FRUIT</span><h2 id="maneuver-heading">Try a maneuver</h2></div><p>Preview each move against your current pattern, then apply it to your baseline when it feels right.</p></div>
            <div className="maneuver-list">{scenarios.map((scenario) => { const delta = score - calculateScore(scenario.profile); const selected = preview?.id === scenario.id; return <div className="maneuver-item" key={scenario.id}><div className={`maneuver-icon ${scenario.tone === "coral" ? "coral" : scenario.tone === "yellow" ? "yellow" : ""}`}>{scenario.icon}</div><div className="maneuver-copy"><strong>{scenario.title}</strong><span>{scenario.description}</span></div><div className={`maneuver-delta ${delta <= 0 ? "is-done" : ""}`}>{delta > 0 ? `−${delta} pts` : "Already in place"}</div><div className="maneuver-cost">{scenario.cost}</div><div className="maneuver-actions"><button className="maneuver-button" type="button" onClick={() => setPreview(selected ? null : scenario)} aria-pressed={selected}>{selected ? "Selected" : "Preview →"}</button>{selected ? <button className="maneuver-apply-button" type="button" onClick={() => applyScenario(scenario)}>Apply & save</button> : null}</div></div>; })}</div>
          </section>

          <MarketplacePanel demoMode={demoMode} />
        </>
      ) : null}

      {view === "analytics" ? (
        <AnalyticsPanel
          score={score}
          scoreLabel={scoreLabel(score)}
          forecast={{ score: bestNextScore, label: "If you take your best next move", period: "NEXT WEEK", description: "A preview only—your score changes when you apply a maneuver to your baseline." }}
          breakdown={analyticsBreakdown}
          weeklyTrend={analyticsTrend}
          scenarios={analyticsScenarios}
          title="See the pattern, then choose the lever."
          description="Charts are generated from your current local baseline. The trend is a clearly labeled simulated history until real check-ins are connected."
        />
      ) : null}

      {view === "baseline" ? (
        <>
          <section className="dashboard-card profile-card baseline-card" aria-labelledby="profile-heading">
            <div><span className="label-caps">YOUR BASELINE</span><h2 id="profile-heading">What’s in a normal week?</h2><p>These four inputs drive the estimate. Use the dials, then save a baseline when it feels like a fair description of your week.</p></div>
            <div className="baseline-summary"><span><strong>{score}</strong><small>current score</small></span><span><strong>{plantShare}%</strong><small>plant-forward</small></span><span><strong>{FOOD_KEYS.reduce((total, key) => total + profile.servings[key], 0)}</strong><small>tracked choices</small></span></div>
            {FOOD_KEYS.map((key) => { const meta = FOOD_META[key]; return <div className="profile-row" key={key}><div className="profile-label"><strong>{meta.label}</strong><span>{formatServing(profile.servings[key], meta.unit.split(" ")[0])}</span></div><div className="profile-control"><label className="sr-only" htmlFor={`${key}-servings`}>{meta.label} {meta.unit}</label><input id={`${key}-servings`} type="range" min="0" max="3" step="1" value={profile.servings[key]} onChange={(event) => changeServing(key, Number(event.target.value))} /><output htmlFor={`${key}-servings`}>{profile.servings[key]}</output></div><label className="sr-only" htmlFor={`${key}-source`}>{meta.label} source</label><select id={`${key}-source`} className="profile-select" value={profile.sources[key]} onChange={(event) => changeSource(key, event.target.value as SourceKey)}>{meta.sources.map((source) => <option key={source.key} value={source.key}>{source.label}</option>)}</select></div>; })}
            <button className="button button-primary button-wide" type="button" onClick={() => void persistProfile(profile, setSyncState, demoMode)}>Save my baseline</button>
            <p className="save-note">{demoMode ? "This demo keeps your changes in the current session only." : "Your estimate is private to your account. Vendor links are labeled so you can decide whether they’re useful."}</p>
          </section>
          <section className="dashboard-card section-card method-card" id="method" aria-labelledby="method-heading"><div className="method-copy"><span className="label-caps">THE METHOD, IN PLAIN ENGLISH</span><h2 id="method-heading">A transparent estimate beats a magic number.</h2><p>Careprint v0.2 combines how often a choice shows up with a directional welfare-pressure factor for the source. Charts and forecasts are explainable views over that same local model.</p></div><div className="method-formula"><div className="formula-line"><span>frequency</span> × <span>welfare signal</span> = <strong>weekly estimate</strong></div><div className="formula-line"><span>your baseline</span> − <span>one maneuver</span> = <strong>new estimate</strong></div><p className="formula-caption">Lower is kinder. No vendor can pay to change the math. This is an educational estimate, not a certification or a complete measure of animal suffering.</p></div></section>
        </>
      ) : null}
    </>
  );
}

async function persistProfile(profile: Profile, setSyncState: (state: SyncState) => void, demoMode = false) {
  if (demoMode) {
    setSyncState("saved");
    return;
  }
  setSyncState("loading");
  try {
    const response = await fetch("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile }) });
    if (!response.ok) throw new Error("Unable to save profile");
    setSyncState("saved");
  } catch {
    setSyncState("error");
  }
}

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || "there";
}

function toneForFood(key: FoodKey): AnalyticsTone {
  if (key === "beef") return "coral";
  if (key === "salmon") return "sage";
  if (key === "eggs") return "yellow";
  return "mint";
}
