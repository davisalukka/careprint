"use client";

import { useEffect, useRef } from "react";
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

/**
 * The Ember: one coherent ball for the whole week. Every vector you add packs
 * more grains of matter into it — the mass grows, compacts, heats toward deep
 * red, and trembles under harsher sourcing. Draining vectors dissolves the
 * grains until only a faint, transparent shell is left at zero.
 */

const SIZE = 680;
const CENTER = SIZE / 2;
const TAU = Math.PI * 2;
const GRAINS_PER_POINT = 3.4;

type Grain = {
  a: number;
  rr: number;
  ph: number;
  size: number;
  alpha: number;
  dying: boolean;
  tint: number;
};

type Sim = {
  target: { score: number; sev: number };
  score: number;
  grains: Grain[];
};

export function FootprintVisual({
  profile,
  showLegend = false,
}: {
  profile: Profile;
  showLegend?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Sim | null>(null);

  const score = calculateScore(profile);
  const breakdown = buildBreakdown(profile);
  const severity = weightedSeverity(profile);
  const hot = score > 62;
  const totalValue = breakdown.reduce((sum, point) => sum + point.value, 0);

  if (!simRef.current) {
    simRef.current = { target: { score, sev: severity }, score, grains: [] };
    retarget(simRef.current);
  }

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.target = { score, sev: severity };
    retarget(sim);
  }, [score, severity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const loop = (t: number) => {
      const sim = simRef.current;
      if (sim) drawEmber(ctx, sim, reduced ? 0 : t);
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const ariaLabel = [
    `Living footprint visual: one ball of estimated pressure, ${score} out of 100, ${scoreLabel(score).toLowerCase()}.`,
    "It grows and reddens as weekly pressure accumulates and fades toward transparent at zero.",
    ...breakdown.map((point) => `${point.label}: ${point.value} points (${sourceLabelFor(point.key, profile)}).`),
  ].join(" ");

  return (
    <div className={styles.wrap}>
      <figure className={styles.figure} role="img" aria-label={ariaLabel}>
        <canvas ref={canvasRef} className={styles.canvas} width={SIZE} height={SIZE} aria-hidden="true" />
        <div className={`${styles.overlay} ${hot ? styles.overlayHot : ""}`} aria-hidden="true">
          <strong>{score}</strong>
          <span>/100</span>
          <small>lower is kinder</small>
        </div>
      </figure>

      {showLegend ? (
        <ul className={styles.legend}>
          {breakdown.map((point) => {
            const isPlant = profile.sources[point.key] === "plant";
            const share = totalValue > 0 ? point.value / totalValue : 0;
            return (
              <li key={point.key}>
                <span
                  className={styles.legendDot}
                  style={{ background: heatColor(score), opacity: isPlant || point.value === 0 ? 0.15 : 0.25 + share * 0.75 }}
                />
                <div>
                  <strong>{point.label}</strong>
                  <span>{sourceLabelFor(point.key, profile)} · {point.detail}</span>
                </div>
                <b className={styles.legendPts} style={{ color: point.value === 0 ? "var(--sage)" : "var(--ink)" }}>
                  {point.value === 0 ? (isPlant ? "clear 🌱" : "quiet") : `${point.value} pts`}
                </b>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** How much of the week's pressure comes from harsher tiers, 0..1. */
function weightedSeverity(profile: Profile): number {
  let weighted = 0;
  let total = 0;
  for (const key of FOOD_KEYS) {
    const value = profile.servings[key] * pointsFor(key, profile.sources[key]);
    const maxPoints = Math.max(...FOOD_META[key].sources.map((option) => option.points));
    if (maxPoints > 0) weighted += value * (pointsFor(key, profile.sources[key]) / maxPoints);
    total += value;
  }
  return total > 0 ? weighted / total : 0;
}

function retarget(sim: Sim): void {
  const want = Math.round(sim.target.score * GRAINS_PER_POINT);
  const alive = sim.grains.filter((grain) => !grain.dying);
  for (let i = alive.length; i < want; i += 1) {
    sim.grains.push({
      a: Math.random() * TAU,
      rr: Math.sqrt(Math.random()),
      ph: Math.random() * TAU,
      size: 2.2 + Math.random() * 3.4,
      alpha: 0,
      dying: false,
      tint: Math.random(),
    });
  }
  for (let i = want; i < alive.length; i += 1) alive[i].dying = true;
  for (let i = 0; i < Math.min(want, alive.length); i += 1) alive[i].dying = false;
}

function drawEmber(ctx: CanvasRenderingContext2D, sim: Sim, t: number): void {
  ctx.clearRect(0, 0, SIZE, SIZE);
  sim.score += (sim.target.score - sim.score) * 0.06;
  const k = sim.score / 100;
  const h = heatColor(sim.score);
  const radius = 74 + 137 * Math.sqrt(k);

  // Ambient glow grows with heat.
  const glow = ctx.createRadialGradient(CENTER, CENTER, radius * 0.2, CENTER, CENTER, radius * 1.5);
  glow.addColorStop(0, `${h}55`);
  glow.addColorStop(1, `${h}00`);
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.25 + 0.65 * k;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, radius * 1.5, 0, TAU);
  ctx.fill();

  // A faint cool shell, so zero is still a presence — just a transparent one.
  ctx.globalAlpha = 0.16 + 0.1 * (1 - k);
  ctx.strokeStyle = "#193024";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, radius, 0, TAU);
  ctx.stroke();

  for (let i = sim.grains.length - 1; i >= 0; i -= 1) {
    const grain = sim.grains[i];
    grain.alpha += grain.dying ? -0.025 : (1 - grain.alpha) * 0.035;
    if (grain.alpha <= 0) {
      sim.grains.splice(i, 1);
      continue;
    }
    if (t !== 0) {
      grain.ph += 0.01 + 0.05 * sim.target.sev * k;
      grain.a += 0.0012 + 0.0022 * k;
    }
    const jitter = (1.2 + 6.5 * sim.target.sev * k) * Math.sin(grain.ph);
    const rr = grain.rr * (radius - 8) + jitter;
    const x = CENTER + Math.cos(grain.a) * rr;
    const y = CENTER + Math.sin(grain.a) * rr;
    ctx.beginPath();
    ctx.arc(x, y, grain.size * (0.75 + 0.5 * k), 0, TAU);
    ctx.fillStyle = mixHex(h, grain.tint > 0.5 ? "#1c0d08" : "#ffffff", 0.22 * Math.abs(grain.tint - 0.5) * 2);
    ctx.globalAlpha = grain.alpha * (0.28 + 0.6 * k);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function sourceLabelFor(key: FoodKey, profile: Profile): string {
  return FOOD_META[key].sources.find((option) => option.key === profile.sources[key])?.label ?? "Unknown";
}

// Cool translucent mint → amber → deep saturated red as pressure climbs.
function heatColor(score: number): string {
  if (score <= 50) return mixHex("#9fc4ab", "#e8a24b", score / 50);
  return mixHex("#e8a24b", "#b3271b", (score - 50) / 50);
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
