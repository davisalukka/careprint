import type { Metadata } from "next";
import Link from "next/link";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "Your Careprint dashboard",
  description: "See your weekly estimate and the next highest-leverage food swap.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireChatGPTUser("/dashboard");

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand-lockup" href="/" aria-label="Careprint home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span><strong>careprint</strong><small>food choices, made kinder</small></span>
        </Link>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <a href="#overview">Overview</a>
          <a href="#switch-lab">Switch lab</a>
          <a href="#partners">Partners</a>
          <a href={chatGPTSignOutPath("/")}>Sign out</a>
        </nav>
        <div className="account-chip" title={user.email}>
          <span className="account-avatar" aria-hidden="true">{user.displayName.slice(0, 1).toUpperCase()}</span>
          <span>{user.displayName}</span>
        </div>
      </header>

      <DashboardClient user={user} />

      <footer className="dashboard-footer">
        <span>Careprint v0.1 · Score model is directional and still learning.</span>
        <a href="#method">How we estimate it ↗</a>
      </footer>
    </main>
  );
}
