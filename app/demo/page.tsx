import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardClient } from "../dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Careprint demo",
  description: "Explore the Careprint dashboard with local-only stubbed integrations.",
};

export const dynamic = "force-dynamic";

export default function DemoPage() {
  if (process.env.NODE_ENV === "production") redirect("/signin-with-chatgpt?return_to=%2Fdashboard");

  const demoUser = { userId: "demo-user", displayName: "Demo User", email: "demo@careprint.local" };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand-lockup" href="/" aria-label="Careprint home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span><strong>careprint</strong><small>food choices, made kinder</small></span>
        </Link>
        <nav className="dashboard-nav" aria-label="Demo navigation">
          <a href="#overview">Overview</a>
          <a href="#switch-lab">Switch lab</a>
          <a href="#partners">Partners</a>
          <Link href="/">Exit demo</Link>
        </nav>
        <div className="account-chip" title="Local-only demo account">
          <span className="account-avatar" aria-hidden="true">D</span>
          <span>Demo mode</span>
        </div>
      </header>
      <DashboardClient user={demoUser} demoMode />
      <footer className="dashboard-footer"><span>Careprint demo · no external services are called.</span><a href="#method">How we estimate it ↗</a></footer>
    </main>
  );
}
