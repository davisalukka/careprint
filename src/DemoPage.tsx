import { DashboardClient } from "./dashboard/DashboardClient";
import { DEMO_PATH, HOME_PATH, METHODOLOGY_PATH } from "./paths";

const demoUser = { userId: "demo-user", displayName: "Demo User", email: "demo@careprint.local" };

export function DemoPage() {
  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <a className="brand-lockup" href={HOME_PATH} aria-label="Careprint home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span><strong>careprint</strong><small>food choices, made kinder</small></span>
        </a>
        <nav className="dashboard-nav" aria-label="Demo navigation">
          <a href={`${DEMO_PATH}#overview`}>Overview</a>
          <a href={`${DEMO_PATH}#switch-lab`}>Switch lab</a>
          <a href={`${DEMO_PATH}#partners`}>Partners</a>
          <a href={HOME_PATH}>Exit demo</a>
        </nav>
        <div className="account-chip" title="Local-only demo account">
          <span className="account-avatar" aria-hidden="true">D</span>
          <span>Demo mode</span>
        </div>
      </header>
      <DashboardClient user={demoUser} demoMode />
      <footer className="dashboard-footer"><span>Careprint demo · no external services are called.</span><a href={METHODOLOGY_PATH}>Full methodology ↗</a></footer>
    </main>
  );
}
