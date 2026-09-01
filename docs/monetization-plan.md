# Careprint: monetization analysis and priority list

_Research and analysis only, prepared 2026-09-01. No outreach, sign-ups, or product code
changes were made. Vendor and program terms below come from public web sources as of that
date and must be confirmed directly before relying on them._

## 1. Where the project actually stands

**Codebase.** A static Vite + React site (three routes: landing, `/demo`, `/methodology`),
about 3,000 lines of source, deployed to GitHub Pages from `main`. Lint, typecheck, build,
and all 20 tests pass on the current head. No server, no analytics, no accounts, no email
capture, no sitemap or Open Graph tags, no custom domain.

**Model.** The v2 scoring model is the strongest asset: six categories, certification-mapped
source tiers, an uncertainty band, and a methodology page rendered from the same weight
table the score uses. It is explainable and defensible, which is exactly what an affiliate
site in this niche needs to be trusted.

**Monetization plumbing.** There is none yet. The "directory" is three hard-coded fixtures
with in-memory click recording and no outbound links. The type layer is ready for it
(`affiliate.eligible`, `disclosure`, click events), so wiring real links is a small change,
not a rebuild.

**Acquisition.** Zero. There is no content beyond the three pages, so there is no organic
search surface. Affiliate revenue is a function of qualified traffic, and today the site has
no channel that produces it. This is the single biggest gap, ahead of any affiliate
sign-up.

### Problems found during review

| # | Finding | Why it matters | Where |
|---|---|---|---|
| 1 | The methodology page and the egg tier text cite **BC SPCA Certified** as an active audited standard. The BC SPCA ended that program in 2021. | The whole pitch is "we say higher-welfare because it's checkable." Citing a dead certification undercuts that on the first careful read. | `src/lib/footprint-model.ts` (eggs certified tier), `src/MethodologyPage.tsx` (certs section) |
| 2 | Landing page shows an avatar stack ("J M A") beside "Built for honest progress" with no users behind it. | Implied social proof with no users is the kind of thing the Competition Bureau's deceptive-marketing rules and Ad Standards care about, and it contradicts the brand's honesty stance. | `src/LandingPage.tsx` trust-line |
| 3 | Vendor fixtures are real companies with placeholder details. Rowe Farms is Toronto and Guelph, not KW as tagged. Northern Raised's own site describes both "seafood from Ontario farms" and "wild-caught salmon," which needs clarifying before it gets a "wild" tier. | Directory credibility. The fixtures already say "placeholder," which is honest, but they should not ship to real users. | `src/lib/integration-stubs.ts` |
| 4 | GitHub Pages terms prohibit sites "primarily directed at facilitating commercial transactions." Donation buttons are explicitly allowed; an affiliate directory is a grey zone. | Hosting risk at the exact moment the site starts earning. Cloudflare Pages allows commercial use on its free plan, and the repo already had a Cloudflare deployment path in its history. | `.github/workflows/deploy.yml`, `vite.config.ts` |
| 5 | Two full dashboard UIs (Streamlined and Classic) are maintained in parallel. | Doubles the surface area for every copy, disclosure, and tracking change. Pick one before adding money. | `src/DemoPage.tsx` |
| 6 | Leftover `AffiliateAttribution.source: "chatgpt"` type from the removed sign-in flow. | Cosmetic, but it will confuse whoever wires real attribution. | `src/lib/integration-stubs.ts` |
| 7 | "Careprint" is already used by a UK funeral-stationery printer (Islestart Ltd) and an Indian screen-printing supplier. Different goods and jurisdictions, but a CIPO search has not been run. | Brand risk before spending on a domain and content. The CIPO database could not be queried from this environment. | README item 8 |

## 2. Market research: what can actually pay

### Affiliate and referral programs found

| Vendor | Region / model | Program | Terms found | Welfare verification (per methodology taxonomy) |
|---|---|---|---|---|
| **truLOCAL** | Kitchener HQ, ships Canada-wide, monthly meat boxes | Affiliate via ShareASale, now migrated to Awin | 10% of new-customer first purchase (subscriptions), 30-day cookie, average order about $259, so roughly $25 per referral | Grass-fed beef, free-run chicken, pasture-raised heritage pork, raised without antibiotics. No third-party welfare certification found. Tier: unverified claims, partial signal. |
| **Papa Earth** | Ontario farms, Ontario delivery, subscription + a la carte | In-house affiliate program | Up to 10% on first order, tracked via affiliate login | Pasture-raised, no added hormones or antibiotics. No certification found. Tier: unverified. |
| **ButcherBox Canada** (butcherbox.ca) | Canada-wide subscription boxes | In-house affiliate program (separate from the US Impact program) | Commission on new-customer first orders between $199 and $799; rate not published in sources found | "Humanely raised" marketing claims; largely uncertified. Tier: unverified. |
| **Beretta Farms** | King City, Ontario; delivery + farm market | Customer refer-a-friend via ReferralCandy | Give 10% / get 10% (or $20 / $20); codes expire in 60 days. Store credit, not cash. | Certified Organic. Tier: Canadian Organic (partial signal). |
| **Fresh City Farms** (owns Mama Earth Organics) | GTA organic grocery delivery | Customer refer-a-friend | $20 credit each way. Store credit, not cash. | Organic focus; meat sourcing varies by product. |
| **Goodfood / HelloFresh Canada** | Meal kits | CJ Affiliate | $10 to $20 CAD per new subscriber | Weak welfare fit. Off-mission; not recommended. |
| **Amazon Associates CA** | Grocery | Network | 1% on grocery | Not worth the disclosure clutter. |

### Vendors with no public program (would need a negotiated coupon-code deal)

Rowe Farms (Toronto + Guelph stores), West Side Beef (Toronto e-butcher, subscriptions),
Northern Raised (Ontario seafood delivery), Provenance (regenerative meat and eggs, GTA + KW),
The Butcher Shoppe Direct (Harley Farms pasture-raised eggs), Bailey's Local Foods (KW online
farmers' market), Little Fields Farm and Land Basket Farm (KW/London CSA-style meat and eggs).
The README's instinct is right: coupon codes beat tracking links for Shopify-era farm stores,
and the model's "we may earn a referral fee if you order via this link or code" disclosure
already covers both.

### Certified products for the "different store" maneuvers (not monetizable, but essential)

Greenfield Natural Meat Co. (Maple Leaf) is Certified Humane and gestation-crate-free, sold at
Sobeys and Metro. Certified Humane lists Canadian producers such as Greenfield and Supreme Egg
Products (Etobicoke). A Greener World (Animal Welfare Approved) certifies some Canadian farms.
The directory should point to these for chicken, pork, and eggs even though nobody pays for
the click, because that is what makes the maneuvers actionable and the site trustworthy.

### Demand signals worth building content around

- Canada is only 21% cage-free (UK 82%, US 47%), and the rate has moved 3 points in five years
  (Mercy For Animals 2026 Canada scorecard).
- 80% of Canadians say hens should not be caged, yet 68% of consumers wrongly believe "free run"
  means outdoor access and only 14% read the label correctly (Animal Justice / Bryant Research).
- Conventional cages are legally phased out by 2036, so this stays in the news for a decade.

That gap between what people want and what they can decode is the content wedge. It maps
directly onto the model's own headline claim that the certified-egg switch is the cheapest
welfare win on the board.

### Honest revenue math

At truLOCAL's terms, one conversion is worth about $25. A reasonable funnel for an engaged
demo user is a 5 to 10% click-through to the contextual vendor card and a 2 to 5% purchase
rate on those clicks, so 1,000 demo sessions produce roughly 1 to 5 conversions, or $25 to
$125. Fixed costs are a domain (about $15 to $20 a year) and optional analytics (Umami Cloud is
free to 100k events; Plausible starts at $9 a month). The business breaks even at a handful of
conversions a year. It becomes meaningful only at tens of thousands of monthly visitors, which
is why traffic, not the affiliate sign-up, is the constraint.

Realistic targets: first affiliate approval within two weeks of having a custom domain,
first commission within 60 days, 1,000 monthly sessions by month three, $200 a month by month
six if the content engine runs.

## 3. Compliance guardrails (already mostly designed in)

- **Disclosure.** Ad Standards' October 2025 Influencer Marketing Disclosure Guidelines
  require clear, conspicuous disclosure of affiliate commissions on every page where the links
  appear. The Competition Bureau treats commissions as a material connection that must be
  disclosed; administrative penalties for misleading representations reach $750,000 for
  individuals. The existing adjacent-disclosure design and the "paid placement never changes
  ranking or score" rule satisfy this. Keep the test that enforces "never cruelty-free."
- **Email (CASL).** When a newsletter is added: express consent with an unchecked box, a
  description of what will be sent, sender identity with a mailing address, an unsubscribe
  link, and a record of each consent.
- **Privacy (PIPEDA).** Not triggered while the site stays static with local storage only.
  Staying serverless through the first revenue is a feature, not a limitation.
- **Hosting.** Move off GitHub Pages before adding affiliate links (see finding 4).

## 4. Other revenue lines, ranked

1. **Affiliate referrals** (primary): truLOCAL, Papa Earth, ButcherBox.ca now; negotiated
   coupon codes with farm-direct vendors next.
2. **Newsletter** (beehiiv free tier, 0% revenue cut, built-in ad network): a weekly "one
   swap" note. This is the audience asset that makes affiliate work compound, and it becomes
   sponsorable past roughly 1,000 subscribers.
3. **Tip jar** (Buy Me a Coffee or Ko-fi) on the methodology page. Negligible revenue, zero
   effort, and explicitly permitted even on GitHub Pages.
4. **Vendor-paid verification listing.** Deprioritize. Even as a flat audit fee that does not
   touch ranking, it reads as pay-to-play and collides with the core promise. Revisit only
   after the directory has independent credibility.
5. **Premium / accounts.** Needs a server and a privacy policy; willingness to pay is low.
   Not before the traffic exists.

## 5. Priority list

Items marked **(you)** involve outreach, sign-ups, or identity and are yours to run. Everything
else is code or content that can be built without contacting anyone.

### Phase 0. Credibility and foundations (this week)

1. **Fix the BC SPCA Certified references** in the model's egg tier text and the methodology
   certification section. Replace with Certified Humane and Animal Welfare Approved, and note
   that BC SPCA's program ended in 2021.
2. **Remove the avatar-stack social proof** from the landing page trust line. Keep the words.
3. **Pick one dashboard UI** (Streamlined is the newer one and already has the contextual
   vendor slot). Keep Classic reachable only by query parameter or retire it.
4. **Run a CIPO trademark search on "Careprint" and check domain availability (you).**
   Decide the domain before content is written, since URLs are hard to move later.
5. **Move hosting to Cloudflare Pages with the custom domain**, built with `BASE_PATH=/`.
   Keep the GitHub Actions pipeline; only the deploy step changes. This clears the terms-of-
   service question, gives a root-served domain for SEO, and unlocks a free Worker for a
   future click-redirect or email endpoint.
6. **Add privacy-respecting analytics** (Umami Cloud free tier or Plausible) with four
   events: demo started, baseline saved, maneuver applied, partner click. Affiliate programs
   ask about traffic, and you cannot answer without this.
7. **Add the SEO basics** the site is missing: `sitemap.xml`, `robots.txt`, canonical tags,
   Open Graph and Twitter card meta, and a real share image. Submit the sitemap to Google
   Search Console once the domain is live **(you)**.

### Phase 1. Make the directory real, then monetizable (weeks 2 to 4)

8. **Replace the three fixtures with a verified vendor data file** of 8 to 12 Ontario vendors,
   each carrying a verification tier from the methodology taxonomy, real service area (FSA
   prefixes, KW and GTA first), products, and a plain outbound link. Ship this as the
   unmonetized directory the README already planned. Candidate list: truLOCAL, Papa Earth,
   ButcherBox.ca, Beretta Farms, Rowe Farms, West Side Beef, Provenance, The Butcher Shoppe
   Direct, Bailey's Local Foods, Fresh City Farms, Northern Raised (after clarifying wild vs
   farmed), plus Greenfield Natural Meat as a retail-brand entry for pork and chicken.
9. **Apply to the three programs that exist (you):** Awin for truLOCAL, Papa Earth's in-house
   program, ButcherBox.ca's in-house program. Approval is easier with a live custom domain and
   a few content pages, so do this after items 5 and 10 start.
10. **Wire affiliate links behind the existing integration boundary.** Add optional
    `affiliateUrl` and `couponCode` fields to the vendor record, render the adjacent
    disclosure only when one is present, and add a test asserting the directory sort ignores
    affiliate fields (ranking by verification tier, then product match).
11. **Instrument the contextual vendor card** in the Streamlined dashboard. It already picks a
    vendor for the top maneuver; that is the highest-intent placement on the site. Fire the
    partner-click event on the outbound link and treat that as the conversion proxy until
    affiliate dashboards report real orders.
12. **Build the content engine: six static pages** generated by the same Vite build, each with
    the demo CTA and directory embedded. Suggested titles, in order of intent and fit:
    - Canadian egg carton labels decoded: free run vs free range vs certified
    - Chicken or beef: which is worse for animal welfare per serving?
    - Where to buy Certified Humane chicken, pork, and eggs in Ontario
    - truLOCAL's welfare claims, translated into what is actually verified
    - Papa Earth vs truLOCAL vs ButcherBox Canada on animal welfare
    - Gestation-crate-free pork in Ontario: brands and where they are sold
    Review and comparison pages are where affiliate clicks convert; the label decoder is where
    search traffic arrives.
13. **Add email capture** (beehiiv free tier) with CASL-compliant consent copy and a weekly
    "one swap" note that reuses the maneuver library.

### Phase 2. Validate and scale (months 2 to 3)

14. **Run the 20-person credibility test (you)** from the README: "Do you believe this number,
    and would it change what you buy?" Fix methodology before features if the answer is no.
15. **Negotiate coupon-code referrals with two or three farm-direct vendors (you).** Start
    with the ones already selling online through Shopify-style stores, where a code is trivial
    for them to create.
16. **Add the tip jar** to the methodology page.
17. **Publish one new content page a week** and watch which pages produce partner clicks.
    Double down on that category.
18. **Revisit newsletter sponsorship** once the list passes about 1,000 subscribers.

### Deferred until traffic exists

Accounts and server-side persistence, the worldview slider, vendor-paid listings, premium
features.

## 6. What to measure

Weekly: demo sessions, baseline-saved rate, partner click-through rate, outbound conversions
(from affiliate dashboards), newsletter subscribers, and search impressions per content page.

## 7. What could not be verified from this environment

The sandbox blocked direct access to trulocal.ca, papaearth.ca, northernraised.ca,
certifiedhumane.org, and the deployed GitHub Pages site, so program terms above are from
secondary sources and the live site was not re-verified. The CIPO trademark database was not
queried. All affiliate terms should be confirmed on the program pages before sign-up.

## Sources

- truLOCAL affiliate program: https://trulocal.ca/affiliate-program/ and
  https://affiliateeye.com/program/HlMiGfy9ekbLepBP1o/trulocal-ca-affiliate-program
- Papa Earth affiliate program: https://www.papaearth.ca/affiliate-program/
- ButcherBox Canada affiliate program: https://butcherbox.ca/affiliate-program
- Beretta Farms referral program: https://berettafarms.referralcandy.com/
- Fresh City Farms refer-a-friend: https://www.freshcityfarms.com/refer-a-friend
- Goodfood / HelloFresh Canada terms: https://canadiansinternet.com/high-paying-affiliate-programs-canadian-meal-kit/
- ShareASale to Awin migration: https://hellopartner.com/2025/08/19/shareasale-to-sunset-in-us-as-awin-migration-wraps-up/
- BC SPCA Certified program ended: https://spca.bc.ca/programs-services/farm-animal-programs/higher-welfare-food/spca-certified/
- Greenfield Natural Meat Co.: https://www.mapleleaffoods.com/brands/greenfield-natural-meat-co/
- Certified Humane producer list: https://certifiedhumane.org/whos-certified/
- Ad Standards Influencer Marketing Disclosure Guidelines (Oct 2025): https://adstandards.ca/resources/influencer-marketing/
- Competition Bureau, Influencer marketing and the Competition Act: https://competition-bureau.canada.ca/en/deceptive-marketing-practices/types-deceptive-marketing-practices/influencer-marketing-and-competition-act
- CRTC CASL guidance: https://crtc.gc.ca/eng/com500/guide.htm
- GitHub Pages commercial-use terms: https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features
- Cloudflare Pages free-plan limits: https://community.cloudflare.com/t/cloudflare-pages-limits-free-plan/431961
- Mercy For Animals 2026 Canada Animal Welfare Scorecard: https://mercyforanimals.org/canada-scorecard/
- Egg label consumer research: https://animaljustice.ca/uncategorized/consumers-widely-misled-egg-labels
- Umami pricing: https://umami.is/pricing
- Rowe Farms locations: https://www.yelp.ca/biz/rowe-farms-toronto-12
- Northern Raised: https://www.northernraised.ca/products/wild-salmon-portion
- Kitchener-Waterloo vendors: https://www.baileyslocalfoods.com/ , https://provenance.farm/ , https://www.littlefields.farm/ , https://landbasketfarm.com/
