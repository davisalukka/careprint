import { FOOD_KEYS, FOOD_META, MAX_SERVINGS } from "./lib/footprint-model";
import { DEMO_PATH, HOME_PATH, METHODOLOGY_PATH } from "./paths";

/**
 * The methodology page renders the weight table directly from the model, so
 * the published numbers can never drift from the numbers the score uses.
 */
export function MethodologyPage() {
  return (
    <main className="site-shell method-page">
      <header className="site-header">
        <a className="brand-lockup" href={HOME_PATH} aria-label="Careprint home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span><strong>careprint</strong><small>food choices, made kinder</small></span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a href={HOME_PATH}>Home</a>
          <a href={METHODOLOGY_PATH}>Methodology</a>
          <a className="button button-small button-ghost" href={DEMO_PATH}>Open the demo</a>
        </nav>
      </header>

      <article className="method-page-body">
        <section className="method-page-hero">
          <p className="eyebrow"><span className="eyebrow-dot" /> Show your work</p>
          <h1>Every number in the score, and where it comes from.</h1>
          <p className="hero-lede">
            The Careprint score is directional arithmetic, not a verdict. This page shows the whole
            model: the weights, the research they lean on, the certifications behind each source
            tier, and the parts we're least sure about. If something here looks wrong to you, that's
            the point of publishing it.
          </p>
        </section>

        <section className="method-section" aria-labelledby="formula-heading">
          <h2 id="formula-heading">The formula</h2>
          <p>
            For each of six tracked categories, your weekly frequency is multiplied by a welfare
            signal for the source you pick. The six products are summed and rescaled so that a
            heavy, all-conventional week reads about 100 and an all-plant week reads 0. That's the
            entire model — no hidden factors, and no vendor can pay to change it.
          </p>
          <div className="method-formula">
            <div className="formula-line"><span>frequency</span> × <span>welfare signal</span> = <strong>weekly estimate</strong></div>
            <div className="formula-line"><span>your baseline</span> − <span>one maneuver</span> = <strong>new estimate</strong></div>
            <p className="formula-caption">Lower is kinder. Frequencies run 0–{MAX_SERVINGS} per week per category.</p>
          </div>
        </section>

        <section className="method-section" aria-labelledby="ranking-heading">
          <h2 id="ranking-heading">Why chicken and eggs sit at the top</h2>
          <p>
            The weights follow the rough per-serving ranking that welfare-economics research keeps
            converging on: <strong>caged eggs ≈ broiler chicken &gt; farmed fish &gt; pork &gt;&gt; beef &gt; milk</strong>.
            The driver is animal size and living conditions, not moral vibes: one chicken is roughly
            15–20 meals and conventional broilers live in the worst average conditions of any major
            category, while one cow is hundreds of meals, most of them preceded by a life outdoors.
            A per-<em>animal</em> ranking would look very different from this per-<em>serving</em> one — that
            difference confuses almost everyone at first, and it's why "eat less chicken" is usually
            a bigger welfare lever than "eat less beef."
          </p>
        </section>

        <section className="method-section" aria-labelledby="weights-heading">
          <h2 id="weights-heading">The weight table</h2>
          <p>
            Points are per serving (per egg for eggs, per litre for milk). These are the exact
            values the app computes with — this table is rendered from the same code.
          </p>
          {FOOD_KEYS.map((key) => {
            const meta = FOOD_META[key];
            return (
              <div className="weight-block" key={key}>
                <h3><span aria-hidden="true">{meta.icon}</span> {meta.label} <small>{meta.unit}</small></h3>
                <p>{meta.rationale}</p>
                <div className="weight-table-wrap">
                  <table className="weight-table">
                    <thead><tr><th scope="col">Source tier</th><th scope="col">Signal</th><th scope="col">What counts</th></tr></thead>
                    <tbody>
                      {meta.sources.map((source) => (
                        <tr key={source.key}>
                          <th scope="row">{source.label}</th>
                          <td>{source.points}</td>
                          <td>{source.verification}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>

        <section className="method-section" aria-labelledby="certs-heading">
          <h2 id="certs-heading">What the source tiers mean in a Canadian store</h2>
          <p>The tiers map to verifiable claims, in descending order of trust:</p>
          <ul>
            <li><strong>Audited certifications</strong> — Certified Humane, Animal Welfare Approved, and BC SPCA Certified are third-party standards with inspections. These anchor the "certified" and "pasture" tiers.</li>
            <li><strong>Canadian Organic</strong> — regulated and audited, but its welfare requirements are weaker than the dedicated certifications; treat it as a partial signal.</li>
            <li><strong>Unverified marketing claims</strong> — "free-run," "natural," "farm fresh" with no audit behind them. Real information sometimes, but nobody checks; the model scores these closer to the conventional tier on purpose.</li>
          </ul>
          <p>The same taxonomy will govern the vendor directory: a vendor's tier is what we can verify, not what their label says.</p>
        </section>

        <section className="method-section" aria-labelledby="sources-heading">
          <h2 id="sources-heading">Research the weights lean on</h2>
          <ul>
            <li>
              <strong><a href="https://welfarefootprint.org" rel="noopener noreferrer">The Welfare Footprint Project</a></strong> (Schuck-Paim &amp; Alonso) — published time-in-pain estimates for laying hens by housing system and for broiler chickens by breed and stocking density. This is the closest thing to ground truth for the egg and chicken tiers.
            </li>
            <li>
              <strong><a href="https://www.fishwelfareinitiative.org" rel="noopener noreferrer">Fish Welfare Initiative</a></strong> and related aquaculture research — the basis for treating farmed fish as a heavier per-serving load than pork, and for the farmed/wild distinction.
            </li>
            <li>
              <strong><a href="https://rethinkpriorities.org" rel="noopener noreferrer">Rethink Priorities</a></strong> — the Moral Weight Project and welfare-range work, used for rough cross-species comparability. It is openly contested, which is part of why the score is a band and not a point.
            </li>
          </ul>
          <p className="method-honesty">
            An honest caveat: Careprint's weights are a <em>directional synthesis</em> informed by this
            research, not numbers lifted from any single paper. Cross-species comparison requires
            assumptions no study settles. Treat every weight as carrying a wide error bar — which is
            exactly what the score band in the app shows.
          </p>
        </section>

        <section className="method-section" aria-labelledby="uncertainty-heading">
          <h2 id="uncertainty-heading">Uncertainty, stated plainly</h2>
          <p>
            The app displays a directional band around every score (roughly −25% to +30%). The band
            is asymmetric because the biggest open questions — fish sentience, hen time-in-pain by
            housing system, how to weigh a chicken's experience against a pig's — mostly push
            plausible pressure <em>up</em>, not down. What the band does <em>not</em> capture: your actual
            portion sizes, regional differences between farms within a tier, and anything outside
            animal welfare (climate, nutrition, price). The score compares your weeks to each other
            and ranks your own levers; it is not a tool for judging other people's plates.
          </p>
        </section>

        <section className="method-section" aria-labelledby="faq-heading">
          <h2 id="faq-heading">The two questions everyone asks</h2>
          <h3>"Are you saying beef is fine?"</h3>
          <p>
            No — beef is a smaller <em>per-serving welfare</em> lever, which is a narrow claim. One cow is
            hundreds of meals; one chicken is about fifteen. If you care most about climate, the
            ranking inverts and beef becomes the biggest lever. Careprint measures one thing and
            says so.
          </p>
          <h3>"Why doesn't plant milk get a score?"</h3>
          <p>
            Plant-based swaps score zero because this is a scale of <em>animal welfare pressure</em>, and
            there is no animal in the supply chain. Zero doesn't mean "perfect food" — it means
            "nothing for this particular ruler to measure."
          </p>
        </section>

        <section className="method-section" aria-labelledby="privacy-heading">
          <h2 id="privacy-heading">Privacy</h2>
          <p>
            Careprint currently collects <strong>nothing</strong>. The site is static; there is no server, no
            account, no analytics beacon, and no cookie. Your baseline and weekly check-ins live in
            your own browser's storage (<code>careprint:profile</code> and <code>careprint:checkins</code>) and never
            leave it. To delete everything, clear this site's data in your browser — export a JSON
            backup first if you want to keep it. If Careprint ever adds accounts or server-side
            storage, this page will carry a full policy — what's collected, why, retention, and the
            deletion path — <em>before</em> the first record is written, and the standing rule holds:
            we collect no more food data than the product needs.
          </p>
        </section>

        <section className="method-section" aria-labelledby="disclosure-heading">
          <h2 id="disclosure-heading">Money</h2>
          <p>
            Careprint earns nothing today. The vendor directory is curated and unmonetized. If
            referral agreements are ever added, each affected card will say so plainly, adjacent to
            the card ("we may earn a referral fee if you order via this link or code"), and two
            rules are permanent: <strong>paid placement never changes the score math</strong>, and
            <strong> paid placement never changes vendor ranking</strong>. We use the term
            "higher-welfare" throughout because it is comparative and checkable; we never describe
            any product as "cruelty-free," because that is a claim no one can audit.
          </p>
        </section>
      </article>

      <footer className="site-footer">
        <div className="brand-lockup brand-lockup-footer"><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span><span><strong>careprint</strong><small>food choices, made kinder</small></span></div>
        <p>© 2026 Careprint · An independent estimate, not a certification.</p>
        <a href={DEMO_PATH}>Open demo ↗</a>
      </footer>
    </main>
  );
}
