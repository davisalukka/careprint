"use client";

import { useEffect, useState } from "react";
import { DashboardClient } from "./dashboard/DashboardClient";
import { StreamlinedDashboard } from "./dashboard/StreamlinedDashboard";
import { DEMO_PATH, HOME_PATH, METHODOLOGY_PATH } from "./paths";

const demoUser = { userId: "demo-user", displayName: "Demo User", email: "demo@careprint.local" };

export function DemoPage() {
  const [uiMode, setUiMode] = useState<"streamlined" | "classic">("streamlined");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    if (modeParam === "classic" || modeParam === "streamlined") {
      setUiMode(modeParam);
    } else {
      const stored = window.localStorage.getItem("careprint:ui_mode");
      if (stored === "classic" || stored === "streamlined") {
        setUiMode(stored);
      }
    }
  }, []);

  function handleModeChange(mode: "streamlined" | "classic") {
    setUiMode(mode);
    try {
      window.localStorage.setItem("careprint:ui_mode", mode);
      const url = new URL(window.location.href);
      url.searchParams.set("mode", mode);
      window.history.replaceState(null, "", url.toString());
    } catch {
      // Ignore
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <a className="brand-lockup" href={HOME_PATH} aria-label="Careprint home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span><strong>careprint</strong><small>food choices, made kinder</small></span>
        </a>

        {/* View Toggle */}
        <div className="ui-mode-toggle" role="group" aria-label="Dashboard UI Version">
          <button
            type="button"
            className={`ui-mode-btn ${uiMode === "streamlined" ? "is-active" : ""}`}
            onClick={() => handleModeChange("streamlined")}
            aria-pressed={uiMode === "streamlined"}
          >
            ✨ Streamlined
          </button>
          <button
            type="button"
            className={`ui-mode-btn ${uiMode === "classic" ? "is-active" : ""}`}
            onClick={() => handleModeChange("classic")}
            aria-pressed={uiMode === "classic"}
          >
            📋 Classic
          </button>
        </div>

        <nav className="dashboard-nav" aria-label="Demo navigation">
          {uiMode === "classic" ? (
            <>
              <a href={`${DEMO_PATH}#overview`}>Overview</a>
              <a href={`${DEMO_PATH}#switch-lab`}>Switch lab</a>
              <a href={`${DEMO_PATH}#partners`}>Partners</a>
            </>
          ) : (
            <>
              <a href={METHODOLOGY_PATH}>Methodology</a>
              <a href={`${DEMO_PATH}#partners`}>Partners</a>
            </>
          )}
          <a href={HOME_PATH}>Exit demo</a>
        </nav>

        <div className="account-chip" title="Local-only demo account">
          <span className="account-avatar" aria-hidden="true">D</span>
          <span>Demo</span>
        </div>
      </header>

      {uiMode === "streamlined" ? (
        <StreamlinedDashboard user={demoUser} demoMode />
      ) : (
        <DashboardClient user={demoUser} demoMode />
      )}

      <footer className="dashboard-footer">
        <span>Careprint demo · local only, no external servers called.</span>
        <a href={METHODOLOGY_PATH}>Full methodology ↗</a>
      </footer>
    </main>
  );
}
