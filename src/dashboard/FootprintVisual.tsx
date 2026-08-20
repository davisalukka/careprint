"use client";

import { useId, type CSSProperties } from "react";
import {
  buildBreakdown,
  calculateScore,
  FOOD_KEYS,
  FOOD_META,
  pointsFor,
  scoreLabel,
  type FoodKey,
  type Profile,
} from "../lib/footprint-model";
import styles from "./FootprintVisual.module.css";

// Each vector claims a compass direction around the core so the print stays
// readable: beef top, salmon right, eggs bottom, milk left (slightly offset
// so the silhouette reads organic rather than mechanical).
const LOBE_ANGLES: Record<FoodKey, number> = {
  beef: -104,
  salmon: -12,
  eggs: 78,
  milk: 168,
};

const CENTER = 170;
const CORE_RADIUS = 57;
// The heaviest possible single vector (beef, conventional, 3 servings).
const MAX_VECTOR_POINTS = 72;

export function FootprintVisual({
  profile,
  showLegend = false,
}: {
  profile: Profile;
  showLegend?: boolean;
}) {
  const uid = useId();
  const gooId = `${uid}-goo`;
  const auraId = `${uid}-aura`;

  const score = calculateScore(profile);
  const breakdown = buildBreakdown(profile);
  const heat = heatColor(score);
  const coreFill = mixHex(heat, "#fffdf9", 0.84);
  const auraRadius = 96 + score * 0.45;
  const pulseSeconds = 6.4 - 4 * (score / 100);

  const ariaLabel = [
    `Living footprint visual: ${score} out of 100, ${scoreLabel(score).toLowerCase()}.`,
    ...breakdown.map((point) => {
      const sourceLabel = sourceLabelFor(point.key, profile);
      return `${point.label}: ${point.value} points (${sourceLabel}).`;
    }),
  ].join(" ");

  return (
    <div className={styles.wrap}>
      <figure className={styles.figure} role="img" aria-label={ariaLabel}>
        <svg className={styles.svg} viewBox="0 0 340 340" aria-hidden="true">
          <defs>
            {/* Blur + alpha contrast makes the lobes merge like a living blob. */}
            <filter id={gooId} x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              />
            </filter>
            <radialGradient id={auraId}>
              <stop offset="0%" stopColor={heat} stopOpacity="0.3" />
              <stop offset="100%" stopColor={heat} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle className={styles.aura} cx={CENTER} cy={CENTER} r={auraRadius} fill={`url(#${auraId})`} />
          <circle
            className={styles.pulse}
            cx={CENTER}
            cy={CENTER}
            r="122"
            style={{ stroke: heat, animationDuration: `${pulseSeconds.toFixed(2)}s` }}
          />

          <g filter={`url(#${gooId})`}>
            <circle className={styles.core} cx={CENTER} cy={CENTER} r={CORE_RADIUS} fill={coreFill} />
            {FOOD_KEYS.map((key) => (
              <Lobe key={key} foodKey={key} profile={profile} breakdownValue={valueFor(key, breakdown)} />
            ))}
          </g>
          {/* Zero-signal vectors render as crisp seeds outside the goo filter,
              which would otherwise threshold small blurred shapes away. */}
          {FOOD_KEYS.map((key) => (
            <Seed key={key} foodKey={key} active={valueFor(key, breakdown) === 0} />
          ))}
        </svg>
        <div className={styles.overlay} aria-hidden="true">
          <strong>{score}</strong>
          <span>/100</span>
          <small>lower is kinder</small>
        </div>
      </figure>

      {showLegend ? (
        <ul className={styles.legend}>
          {breakdown.map((point) => {
            const isPlant = profile.sources[point.key] === "plant";
            return (
              <li key={point.key}>
                <span
                  className={styles.legendDot}
                  style={{ background: isPlant ? "#b5d8c2" : point.color }}
                />
                <div>
                  <strong>{point.label}</strong>
                  <span>{sourceLabelFor(point.key, profile)} · {point.detail}</span>
                </div>
                <b className={styles.legendPts} style={{ color: point.value === 0 ? "var(--sage)" : "var(--ink)" }}>
                  {point.value === 0 ? (isPlant ? "seed 🌱" : "quiet") : `${point.value} pts`}
                </b>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function Lobe({
  foodKey,
  profile,
  breakdownValue,
}: {
  foodKey: FoodKey;
  profile: Profile;
  breakdownValue: number;
}) {
  const meta = FOOD_META[foodKey];
  const isPlant = profile.sources[foodKey] === "plant";
  const maxPoints = Math.max(...meta.sources.map((option) => option.points));
  const severity = maxPoints > 0 ? pointsFor(foodKey, profile.sources[foodKey]) / maxPoints : 0;

  // Area-ish scaling keeps small contributions visible without letting beef
  // swallow the whole print. Zero-signal lobes collapse below the goo filter's
  // alpha threshold and hand off to the crisp seed layer.
  const radius = breakdownValue === 0 ? 3 : 14 + 40 * Math.sqrt(breakdownValue / MAX_VECTOR_POINTS);
  const angle = (LOBE_ANGLES[foodKey] * Math.PI) / 180;
  const distance = 72 + radius * 0.62;
  const x = CENTER + Math.cos(angle) * distance;
  const y = CENTER + Math.sin(angle) * distance;

  const fill = isPlant ? "#b5d8c2" : lobeColor(foodKey);
  const opacity = breakdownValue === 0 ? 0.55 : 0.92;
  // Kinder sources drift slowly and calmly; harsher ones shiver faster.
  const driftSeconds = 9 - 5.5 * severity;
  const amp = Math.max(0.3, radius / 44);
  const ampStyle = { "--amp": amp } as CSSProperties;

  return (
    <g className={styles.lobe} style={{ transform: `translate(${x}px, ${y}px)` }}>
      <g className={styles.breathe} style={{ animationDuration: `${(6 + severity * -1.5 + amp).toFixed(2)}s` }}>
        <circle className={styles.blob} r={radius} fill={fill} opacity={opacity} />
        <g className={styles.driftA} style={{ ...ampStyle, animationDuration: `${driftSeconds.toFixed(2)}s` }}>
          <circle
            className={styles.blob}
            cx={radius * 0.55}
            cy={-radius * 0.3}
            r={radius * 0.52}
            fill={fill}
            opacity={opacity * 0.9}
          />
        </g>
        <g className={styles.driftB} style={{ ...ampStyle, animationDuration: `${(driftSeconds * 1.35).toFixed(2)}s` }}>
          <circle
            className={styles.blob}
            cx={-radius * 0.44}
            cy={radius * 0.4}
            r={radius * 0.38}
            fill={fill}
            opacity={opacity * 0.85}
          />
        </g>
      </g>
    </g>
  );
}

function Seed({ foodKey, active }: { foodKey: FoodKey; active: boolean }) {
  const angle = (LOBE_ANGLES[foodKey] * Math.PI) / 180;
  const x = CENTER + Math.cos(angle) * 88;
  const y = CENTER + Math.sin(angle) * 88;
  return (
    <g
      className={styles.seed}
      style={{ opacity: active ? 1 : 0, transform: `translate(${x}px, ${y}px)` }}
    >
      <circle r="8" fill="#b5d8c2" stroke="#8db59a" strokeWidth="1.5" />
      <circle cx="4.5" cy="-8" r="3" fill="#50735a" />
    </g>
  );
}

function valueFor(key: FoodKey, breakdown: Array<{ key: FoodKey; value: number }>): number {
  return breakdown.find((point) => point.key === key)?.value ?? 0;
}

function sourceLabelFor(key: FoodKey, profile: Profile): string {
  return FOOD_META[key].sources.find((option) => option.key === profile.sources[key])?.label ?? "Unknown";
}

function lobeColor(key: FoodKey): string {
  if (key === "beef") return "#e27352";
  if (key === "salmon") return "#6f9fa6";
  if (key === "eggs") return "#e8bd58";
  return "#8db59a";
}

// mint → amber → deep coral as directional pressure climbs.
function heatColor(score: number): string {
  if (score <= 50) return mixHex("#8fbf9f", "#e8bd58", score / 50);
  return mixHex("#e8bd58", "#c65438", (score - 50) / 50);
}

function mixHex(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const clamp = Math.max(0, Math.min(1, t));
  const channel = (index: number) => Math.round(a[index] + (b[index] - a[index]) * clamp);
  return `#${[channel(0), channel(1), channel(2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}
