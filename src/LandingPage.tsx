import { DEMO_PATH, HOME_PATH } from "./paths";

export function LandingPage() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand-lockup" href={HOME_PATH} aria-label="Careprint home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span><strong>careprint</strong><small>food choices, made kinder</small></span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#trust">Our promise</a>
          <a href={DEMO_PATH}>Try demo</a>
          <a className="button button-small button-ghost" href={DEMO_PATH}>Open demo</a>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> The kinder choice, one move at a time</p>
          <h1>Make the kindest next swap.</h1>
          <p className="hero-lede">
            Careprint turns a complicated food decision into one clear weekly
            action—so you can eat mostly vegan, keep the choices that matter to
            you, and steadily lower the animal-welfare pressure in your basket.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href={DEMO_PATH}>
              Start my estimate<span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href={DEMO_PATH}>Try the interactive demo <span aria-hidden="true">↗</span></a>
          </div>
          <div className="trust-line">
            <span className="avatar-stack" aria-hidden="true"><i>J</i><i>M</i><i>A</i></span>
            <span>Built for honest progress, not perfection.</span>
          </div>
        </div>

        <div className="hero-preview" aria-label="Example Careprint dashboard">
          <div className="preview-glow" />
          <div className="preview-card preview-main-card">
            <div className="preview-card-header">
              <span className="label-caps">THIS WEEK’S ESTIMATE</span>
              <span className="status-pill status-pill-sage"><span /> On track</span>
            </div>
            <div className="preview-score-row">
              <div className="preview-score-ring"><div className="preview-score-inner"><strong>35</strong><span>/100</span></div></div>
              <div>
                <p className="preview-score-title">Low footprint</p>
                <p className="preview-score-note">Lower is kinder</p>
                <div className="score-meter"><span /></div>
              </div>
            </div>
            <div className="preview-divider" />
            <div className="preview-metric-grid">
              <div><strong>81%</strong><span>plant-forward</span></div>
              <div><strong>−13</strong><span>best next move</span></div>
              <div><strong>4</strong><span>weekly choices</span></div>
            </div>
          </div>
          <div className="preview-card preview-action-card">
            <div className="mini-icon mini-icon-coral">↘</div>
            <div><span className="label-caps">LOWEST-HANGING FRUIT</span><strong>Make beef occasional</strong><span>−13 points · usually saves money</span></div>
            <span className="mini-arrow" aria-hidden="true">→</span>
          </div>
          <div className="preview-card preview-note-card">
            <span className="note-scribble" aria-hidden="true">✦</span>
            <p><strong>Small moves compound.</strong><br />Your dashboard shows what matters most next.</p>
          </div>
        </div>
      </section>

      <section className="partner-strip" aria-label="Example partner categories">
        <span className="label-caps">MAKE YOUR NEXT SHOP EASIER</span>
        <div className="partner-names">
          <span><i className="partner-dot partner-dot-green" /> Pasture-raised</span>
          <span><i className="partner-dot partner-dot-blue" /> Ocean-aware</span>
          <span><i className="partner-dot partner-dot-yellow" /> Local pickup</span>
          <span><i className="partner-dot partner-dot-coral" /> Vegan swaps</span>
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow"><span className="eyebrow-dot eyebrow-dot-coral" /> The simple version</p>
          <h2>A kinder plan you can actually keep.</h2>
          <p>You tell us what shows up in a normal week. Careprint makes the trade-offs legible, then puts the highest-leverage move first.</p>
        </div>
        <div className="step-grid">
          <article className="step-card"><span className="step-number">01</span><div className="step-icon step-icon-mint">⌁</div><h3>Set your baseline</h3><p>Beef, salmon, eggs, milk, and the choices you already make well.</p></article>
          <article className="step-card step-card-featured"><span className="step-number">02</span><div className="step-icon step-icon-coral">↗</div><h3>Preview the moves</h3><p>Try one swap at a time and see how your estimate changes before you shop.</p></article>
          <article className="step-card"><span className="step-number">03</span><div className="step-icon step-icon-yellow">◌</div><h3>Shop with context</h3><p>Compare lower-footprint vendors, subscriptions, pickup, and delivery.</p></article>
        </div>
      </section>

      <section className="trust-section" id="trust">
        <div className="trust-panel">
          <div><p className="eyebrow"><span className="eyebrow-dot eyebrow-dot-blue" /> A promise to keep</p><h2>Useful, transparent, and never guilt-first.</h2></div>
          <div className="promise-list">
            <div><span>01</span><p><strong>Directional, not absolute.</strong> Your score is an estimate based on frequency, welfare signals, and confidence—not a claim that any food is “cruelty-free.”</p></div>
            <div><span>02</span><p><strong>Affiliate money stays visible.</strong> Partner links are labeled, and paid placement never changes your score.</p></div>
            <div><span>03</span><p><strong>Progress beats purity.</strong> The tool celebrates the next meaningful move, including the ones that save money.</p></div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="brand-lockup brand-lockup-footer"><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span><span><strong>careprint</strong><small>food choices, made kinder</small></span></div>
        <p>© 2026 Careprint · An independent estimate, not a certification.</p>
        <a href={DEMO_PATH}>Open demo ↗</a>
      </footer>
    </main>
  );
}
