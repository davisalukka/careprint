import { DEMO_PATH, HOME_PATH, METHODOLOGY_PATH } from "./paths";

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
          <a href={METHODOLOGY_PATH}>Methodology</a>
          <a className="button button-small button-ghost" href={DEMO_PATH}>Open the demo</a>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Kinder eating, one swap at a time</p>
          <h1>Make the kindest next swap.</h1>
          <p className="hero-lede">
            You don’t need a food philosophy to be kinder to animals—you need
            to know which change matters most. Careprint reads a normal week
            of chicken, eggs, pork, beef, fish, and milk, then hands you the
            one swap that does the most good for the least effort.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href={DEMO_PATH}>
              Start my estimate<span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a>
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
                <p className="preview-score-title">Low pressure</p>
                <p className="preview-score-note">Lower is kinder</p>
                <div className="score-meter"><span /></div>
              </div>
            </div>
            <div className="preview-divider" />
            <div className="preview-metric-grid">
              <div><strong>74%</strong><span>plant-forward</span></div>
              <div><strong>−13</strong><span>best next move</span></div>
              <div><strong>6</strong><span>tracked foods</span></div>
            </div>
          </div>
          <div className="preview-card preview-action-card">
            <div className="mini-icon mini-icon-coral">↘</div>
            <div><span className="label-caps">LOWEST-HANGING FRUIT</span><strong>Switch to pasture-raised eggs</strong><span>−13 points · same recipes, ~$2 more</span></div>
            <span className="mini-arrow" aria-hidden="true">→</span>
          </div>
          <div className="preview-card preview-note-card">
            <span className="note-scribble" aria-hidden="true">✦</span>
            <p><strong>Small moves compound.</strong><br />One swap a week quietly rewrites a year of eating.</p>
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
          <p>Tell us what a normal week really looks like. Careprint does the arithmetic it can defend, then puts the move worth making at the top.</p>
        </div>
        <div className="step-grid">
          <article className="step-card"><span className="step-number">01</span><div className="step-icon step-icon-mint">⌁</div><h3>Set your baseline</h3><p>Six foods, a dial each—or start from a preset. It takes a minute, and the good choices you already make count from the start.</p></article>
          <article className="step-card step-card-featured"><span className="step-number">02</span><div className="step-icon step-icon-coral">↗</div><h3>Preview the moves</h3><p>Audition one swap at a time and watch your estimate shift before anything changes at the store.</p></article>
          <article className="step-card"><span className="step-number">03</span><div className="step-icon step-icon-yellow">◌</div><h3>Shop with context</h3><p>When you’re ready to buy differently, clearly labeled partners for kinder sourcing are one click away.</p></article>
        </div>
      </section>

      <section className="trust-section" id="trust">
        <div className="trust-panel">
          <div><p className="eyebrow"><span className="eyebrow-dot eyebrow-dot-blue" /> A promise to keep</p><h2>Useful, transparent, and never guilt-first.</h2></div>
          <div className="promise-list">
            <div><span>01</span><p><strong>Directional, not absolute.</strong> The score is honest arithmetic over frequency and sourcing—a compass, not a verdict. We say “higher-welfare” because it’s checkable; we never call anything “cruelty-free,” because that isn’t.</p></div>
            <div><span>02</span><p><strong>Affiliate money stays visible.</strong> Partner links say they’re partner links, and no vendor can buy their way into your score or their ranking.</p></div>
            <div><span>03</span><p><strong>Progress beats purity.</strong> We’d rather you make one real swap than feel guilty about ten imaginary ones. Many of the kindest moves also save money.</p></div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="brand-lockup brand-lockup-footer"><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span><span><strong>careprint</strong><small>food choices, made kinder</small></span></div>
        <p>© 2026 Careprint · An independent estimate, not a certification.</p>
        <a href={METHODOLOGY_PATH}>How the score works ↗</a>
      </footer>
    </main>
  );
}
