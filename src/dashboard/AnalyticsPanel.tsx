"use client";

import { useId, useMemo, useState } from "react";
import styles from "./AnalyticsPanel.module.css";

export type AnalyticsTone = "coral" | "mint" | "yellow" | "sage" | "ochre" | "rose";

export type AnalyticsBreakdownItem = {
  id: string;
  label: string;
  value: number;
  unit?: string;
  helper?: string;
  tone?: AnalyticsTone;
};

export type AnalyticsTrendPoint = {
  id?: string;
  label: string;
  value: number;
  helper?: string;
};

export type AnalyticsForecast = {
  score: number;
  label?: string;
  period?: string;
  description?: string;
};

export type AnalyticsScenario = {
  id: string;
  label: string;
  score: number;
  description?: string;
  detail?: string;
  tone?: AnalyticsTone;
};

export type AnalyticsPanelProps = {
  score: number;
  forecast: AnalyticsForecast;
  breakdown: readonly AnalyticsBreakdownItem[];
  weeklyTrend: readonly AnalyticsTrendPoint[];
  scenarios?: readonly AnalyticsScenario[];
  scoreMax?: number;
  scoreLabel?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
};

type TrendCoordinate = AnalyticsTrendPoint & { x: number; y: number; safeValue: number };

type TrendModel = {
  points: TrendCoordinate[];
  linePath: string;
  areaPath: string;
  ticks: Array<{ value: number; y: number }>;
  min: number;
  max: number;
  baselineY: number;
};

const DIAL_RADIUS = 52;
const DIAL_CENTER = 70;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;
const TREND_WIDTH = 520;
const TREND_HEIGHT = 220;
const TREND_LEFT = 30;
const TREND_RIGHT = 14;
const TREND_TOP = 20;
const TREND_BOTTOM = 34;

const toneClasses: Record<AnalyticsTone, string> = {
  coral: styles.toneCoral,
  mint: styles.toneMint,
  yellow: styles.toneYellow,
  sage: styles.toneSage,
  ochre: styles.toneOchre,
  rose: styles.toneRose,
};

function clamp(value: number, minimum: number, maximum: number): number {
  const safeValue = Number.isFinite(value) ? value : minimum;
  return Math.min(maximum, Math.max(minimum, safeValue));
}

function displayNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function displayMetric(value: number, unit?: string): string {
  return `${displayNumber(value)}${unit ? ` ${unit}` : ""}`;
}

function defaultScoreLabel(score: number, maximum: number): string {
  const ratio = score / maximum;
  if (ratio <= 0.25) return "Very low pressure";
  if (ratio <= 0.45) return "Low pressure";
  if (ratio <= 0.65) return "Moderate pressure";
  return "High pressure";
}

function formatDelta(delta: number): string {
  if (delta === 0) return "No change";
  return delta > 0 ? `−${displayNumber(delta)} pts` : `+${displayNumber(Math.abs(delta))} pts`;
}

function toneClass(tone: AnalyticsTone | undefined): string {
  return toneClasses[tone ?? "mint"];
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function buildTrendModel(points: readonly AnalyticsTrendPoint[]): TrendModel {
  const safePoints = points.map((point) => ({
    ...point,
    safeValue: Math.max(0, Number.isFinite(point.value) ? point.value : 0),
  }));

  const rawMinimum = safePoints.length ? Math.min(...safePoints.map((point) => point.safeValue)) : 0;
  const rawMaximum = safePoints.length ? Math.max(...safePoints.map((point) => point.safeValue)) : 10;
  const rawRange = Math.max(1, rawMaximum - rawMinimum);
  const padding = Math.max(2, rawRange * 0.16);
  const minimum = Math.max(0, Math.floor((rawMinimum - padding) / 5) * 5);
  const maximum = Math.max(minimum + 10, Math.ceil((rawMaximum + padding) / 5) * 5);
  const plotWidth = TREND_WIDTH - TREND_LEFT - TREND_RIGHT;
  const plotHeight = TREND_HEIGHT - TREND_TOP - TREND_BOTTOM;
  const baselineY = TREND_TOP + plotHeight;

  const coordinates: TrendCoordinate[] = safePoints.map((point, index) => {
    const x = safePoints.length <= 1
      ? TREND_LEFT + plotWidth / 2
      : TREND_LEFT + (index / (safePoints.length - 1)) * plotWidth;
    const y = TREND_TOP + (1 - (point.safeValue - minimum) / (maximum - minimum)) * plotHeight;
    return { ...point, x, y };
  });

  const linePath = coordinates.length
    ? coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ")
    : "";
  const areaPath = coordinates.length
    ? `${linePath} L ${coordinates[coordinates.length - 1].x.toFixed(2)} ${baselineY} L ${coordinates[0].x.toFixed(2)} ${baselineY} Z`
    : "";
  const tickValues = [maximum, roundToStep((maximum + minimum) / 2, 5), minimum];
  const ticks = tickValues.map((value) => ({
    value,
    y: TREND_TOP + (1 - (value - minimum) / (maximum - minimum)) * plotHeight,
  }));

  return { points: coordinates, linePath, areaPath, ticks, min: minimum, max: maximum, baselineY };
}

export function AnalyticsPanel({
  score,
  forecast,
  breakdown,
  weeklyTrend,
  scenarios = [],
  scoreMax = 100,
  scoreLabel,
  eyebrow = "WEEKLY VIEW",
  title = "See the pattern, then choose the lever.",
  description = "A quick read on what is driving your estimate, how it is moving, and which small maneuver could help next.",
}: AnalyticsPanelProps) {
  const panelId = useId();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const safeMaximum = Math.max(1, scoreMax);
  const safeScore = clamp(score, 0, safeMaximum);
  const safeForecastScore = clamp(forecast.score, 0, safeMaximum);
  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null;
  const displayedScore = selectedScenario ? clamp(selectedScenario.score, 0, safeMaximum) : safeScore;
  const scoreRatio = displayedScore / safeMaximum;
  const forecastRatio = safeForecastScore / safeMaximum;
  const forecastDelta = safeScore - safeForecastScore;
  const breakdownMaximum = Math.max(1, ...breakdown.map((item) => Math.max(0, item.value)));
  const trend = useMemo(() => buildTrendModel(weeklyTrend), [weeklyTrend]);
  const dialTitleId = `${panelId}-dial-title`;
  const dialDescriptionId = `${panelId}-dial-description`;
  const breakdownTitleId = `${panelId}-breakdown-title`;
  const trendTitleId = `${panelId}-trend-title`;
  const trendDescriptionId = `${panelId}-trend-description`;
  const scenariosTitleId = `${panelId}-scenarios-title`;
  const forecastMarkerAngle = forecastRatio * Math.PI * 2 - Math.PI / 2;
  const forecastMarkerX = DIAL_CENTER + DIAL_RADIUS * Math.cos(forecastMarkerAngle);
  const forecastMarkerY = DIAL_CENTER + DIAL_RADIUS * Math.sin(forecastMarkerAngle);
  const scoreDescription = selectedScenario?.description ?? scoreLabel ?? defaultScoreLabel(displayedScore, safeMaximum);

  function toggleScenario(scenarioId: string) {
    setSelectedScenarioId((current) => current === scenarioId ? null : scenarioId);
  }

  return (
    <section className={styles.panel} aria-labelledby={`${panelId}-heading`}>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}><span className={styles.eyebrowDot} aria-hidden="true" />{eyebrow}</span>
          <h2 className={styles.panelTitle} id={`${panelId}-heading`}>{title}</h2>
        </div>
        <p className={styles.panelDescription}>{description}</p>
      </header>

      <div className={styles.topGrid}>
        <article className={`${styles.card} ${styles.dialCard}`} aria-labelledby={dialTitleId}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.overline}>YOUR ESTIMATE</span>
              <h3 id={dialTitleId}>Welfare footprint</h3>
            </div>
            <span className={`${styles.statusPill} ${styles.toneMint}`}>
              <span className={styles.statusDot} aria-hidden="true" />{selectedScenario ? "Preview" : "On track"}
            </span>
          </div>

          <div className={styles.dialLayout}>
            <div className={styles.dialVisual}>
              <svg
                className={styles.dialSvg}
                viewBox="0 0 140 140"
                role="img"
                aria-labelledby={`${dialTitleId} ${dialDescriptionId}`}
              >
                <title id={dialDescriptionId}>{`${displayNumber(displayedScore)} out of ${displayNumber(safeMaximum)} estimated welfare pressure`}</title>
                <desc>{`Lower is kinder. The forecast marker is ${displayNumber(safeForecastScore)}.`}</desc>
                <circle className={styles.dialTrack} cx={DIAL_CENTER} cy={DIAL_CENTER} r={DIAL_RADIUS} fill="none" />
                <g transform={`rotate(-90 ${DIAL_CENTER} ${DIAL_CENTER})`}>
                  <circle
                    className={styles.dialProgress}
                    cx={DIAL_CENTER}
                    cy={DIAL_CENTER}
                    r={DIAL_RADIUS}
                    fill="none"
                    strokeDasharray={DIAL_CIRCUMFERENCE}
                    strokeDashoffset={DIAL_CIRCUMFERENCE * (1 - scoreRatio)}
                  />
                </g>
                <circle className={styles.forecastMarker} cx={forecastMarkerX} cy={forecastMarkerY} r="4.5" />
              </svg>
              <div className={styles.dialReadout} aria-live="polite">
                <strong>{displayNumber(displayedScore)}</strong>
                <span>/{displayNumber(safeMaximum)}</span>
                <small>lower is kinder</small>
              </div>
            </div>

            <div className={styles.dialCopy}>
              {selectedScenario ? <p className={styles.previewLabel}>MANEUVER PREVIEW · {formatDelta(safeScore - displayedScore)}</p> : null}
              <h4>{scoreDescription}</h4>
              <p>{selectedScenario ? "Select another scenario below, or reset to return to your current estimate." : "This is a directional estimate of welfare pressure across the choices you are tracking."}</p>
              {selectedScenario ? (
                <button className={styles.resetButton} type="button" onClick={() => setSelectedScenarioId(null)}>
                  Reset preview ↺
                </button>
              ) : (
                <span className={`${styles.statusPill} ${styles.toneMint}`}><span className={styles.statusDot} aria-hidden="true" />Directional estimate</span>
              )}

              <div className={styles.forecastCard} aria-label="Score forecast">
                <div className={styles.forecastTopline}>
                  <span className={styles.overline}>FORECAST · {forecast.period ?? "NEXT CHECK-IN"}</span>
                  <span className={`${styles.changeChip} ${forecastDelta >= 0 ? styles.deltaPositive : styles.deltaNegative}`}>{formatDelta(forecastDelta)}</span>
                </div>
                <div className={styles.forecastValue}><strong>{displayNumber(safeForecastScore)}</strong><span>/{displayNumber(safeMaximum)}</span></div>
                <strong className={styles.forecastLabel}>{forecast.label ?? "If your current plan holds"}</strong>
                <p>{forecast.description ?? "A lower number means less estimated welfare pressure than your current baseline."}</p>
              </div>
            </div>
          </div>
        </article>

        <article className={`${styles.card} ${styles.breakdownCard}`} aria-labelledby={breakdownTitleId}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.overline}>BREAKDOWN</span>
              <h3 id={breakdownTitleId}>What is driving the estimate?</h3>
            </div>
            <span className={styles.cardHint}>lower is kinder</span>
          </div>

          {breakdown.length ? (
            <div className={styles.breakdownList} role="list">
              {breakdown.map((item) => {
                const safeValue = Math.max(0, Number.isFinite(item.value) ? item.value : 0);
                const barWidth = clamp((safeValue / breakdownMaximum) * 100, 0, 100);
                return (
                  <div className={styles.breakdownItem} key={item.id} role="listitem">
                    <div className={styles.breakdownMeta}>
                      <span className={`${styles.breakdownDot} ${toneClass(item.tone)}`} aria-hidden="true" />
                      <div className={styles.breakdownLabel}>
                        <strong>{item.label}</strong>
                        {item.helper ? <span>{item.helper}</span> : null}
                      </div>
                      <strong className={styles.breakdownValue}>{displayMetric(safeValue, item.unit)}</strong>
                    </div>
                    <div
                      className={styles.breakdownTrack}
                      role="progressbar"
                      aria-label={`${item.label} contribution`}
                      aria-valuemin={0}
                      aria-valuemax={breakdownMaximum}
                      aria-valuenow={safeValue}
                      aria-valuetext={displayMetric(safeValue, item.unit)}
                    >
                      <span className={`${styles.breakdownFill} ${toneClass(item.tone)}`} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>Add a breakdown to see which choices are carrying the most weight.</div>
          )}
          <p className={styles.cardFootnote}>The bars show relative contribution within this estimate—not a universal ranking of suffering.</p>
        </article>
      </div>

      <div className={styles.bottomGrid}>
        <article className={`${styles.card} ${styles.trendCard}`} aria-labelledby={trendTitleId}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.overline}>WEEKLY TREND</span>
              <h3 id={trendTitleId}>Is the pattern moving?</h3>
            </div>
            {trend.points.length ? <span className={styles.cardHint}>{trend.points.length} {trend.points.length === 1 ? "check-in" : "check-ins"}</span> : null}
          </div>

          {trend.points.length ? (
            <>
              <div className={styles.trendFrame}>
                <svg
                  className={styles.trendSvg}
                  viewBox={`0 0 ${TREND_WIDTH} ${TREND_HEIGHT}`}
                  role="img"
                  aria-labelledby={`${trendTitleId} ${trendDescriptionId}`}
                >
                  <title id={trendDescriptionId}>Weekly welfare footprint trend</title>
                  <desc>{`The trend ranges from ${displayNumber(trend.min)} to ${displayNumber(trend.max)}. Lower scores are kinder.`}</desc>
                  {trend.ticks.map((tick) => (
                    <g key={tick.value}>
                      <line className={styles.trendGridLine} x1={TREND_LEFT} x2={TREND_WIDTH - TREND_RIGHT} y1={tick.y} y2={tick.y} />
                      <text className={styles.axisLabel} x="0" y={tick.y + 4}>{displayNumber(tick.value)}</text>
                    </g>
                  ))}
                  <path className={styles.trendArea} d={trend.areaPath} />
                  <path className={styles.trendLine} d={trend.linePath} />
                  {trend.points.map((point, index) => (
                    <g key={point.id ?? `${point.label}-${index}`}>
                      <circle className={styles.trendPointHalo} cx={point.x} cy={point.y} r="7" />
                      <circle className={styles.trendPoint} cx={point.x} cy={point.y} r="3.5">
                        <title>{`${point.label}: ${displayMetric(point.safeValue)}${point.helper ? ` · ${point.helper}` : ""}`}</title>
                      </circle>
                    </g>
                  ))}
                </svg>
              </div>
              <div className={styles.trendFooter} aria-hidden="true">
                <span>{trend.points[0].label}</span>
                <span>lower is kinder ↓</span>
                <span>{trend.points[trend.points.length - 1].label}</span>
              </div>
              <table className={styles.srOnly}>
                <caption>Weekly welfare footprint trend</caption>
                <thead><tr><th scope="col">Week</th><th scope="col">Score</th><th scope="col">Note</th></tr></thead>
                <tbody>{trend.points.map((point, index) => <tr key={point.id ?? `${point.label}-${index}`}><th scope="row">{point.label}</th><td>{displayMetric(point.safeValue)}</td><td>{point.helper ?? ""}</td></tr>)}</tbody>
              </table>
            </>
          ) : (
            <div className={styles.emptyState}>Your weekly checks will appear here once you have more than one estimate.</div>
          )}
        </article>

        <article className={`${styles.card} ${styles.scenarioCard}`} aria-labelledby={scenariosTitleId}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.overline}>SCENARIO COMPARISON</span>
              <h3 id={scenariosTitleId}>Try a lower-footprint move</h3>
            </div>
            <span className={styles.cardHint}>tap to preview</span>
          </div>
          {scenarios.length ? (
            <div className={styles.scenarioList} role="list">
              {scenarios.map((scenario) => {
                const scenarioScore = clamp(scenario.score, 0, safeMaximum);
                const scenarioDelta = safeScore - scenarioScore;
                const selected = selectedScenarioId === scenario.id;
                return (
                  <div className={`${styles.scenarioRow} ${selected ? styles.scenarioRowSelected : ""}`} key={scenario.id} role="listitem">
                    <button
                      className={styles.scenarioButton}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${scenario.label}: ${displayNumber(scenarioScore)} out of ${displayNumber(safeMaximum)}, ${formatDelta(scenarioDelta)}`}
                      onClick={() => toggleScenario(scenario.id)}
                    >
                      <span className={`${styles.scenarioMarker} ${toneClass(scenario.tone)}`} aria-hidden="true">↗</span>
                      <span className={styles.scenarioCopy}>
                        <strong>{scenario.label}</strong>
                        {scenario.description ? <span>{scenario.description}</span> : null}
                      </span>
                      <span className={styles.scenarioScore}><strong>{displayNumber(scenarioScore)}</strong><span>/{displayNumber(safeMaximum)}</span></span>
                      <span className={`${styles.scenarioDelta} ${scenarioDelta >= 0 ? styles.deltaPositive : styles.deltaNegative}`}>{formatDelta(scenarioDelta)}</span>
                    </button>
                    {scenario.detail ? <span className={styles.scenarioDetail}>{scenario.detail}</span> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>Add a few possible maneuvers to compare them side by side.</div>
          )}
        </article>
      </div>
    </section>
  );
}
