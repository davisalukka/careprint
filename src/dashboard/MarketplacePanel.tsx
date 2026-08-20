"use client";

import { useState } from "react";
import { listMarketplaceOffers, recordAffiliateClick } from "../lib/integration-stubs";

type PartnerOffer = {
  id: string;
  name: string;
  detail: string;
  tag: string;
  verification: string;
  mark: string;
  tone: "mint" | "yellow" | "coral";
};

// The static site has no API to call, so the directory reads the same local
// fixtures the removed /api/stubs route used to serve. No external requests.
const OFFERS: PartnerOffer[] = listMarketplaceOffers().map((offer) => ({
  id: offer.id,
  name: offer.name,
  detail: offer.detail,
  tag: offer.tag,
  verification: offer.verification,
  mark: offer.mark,
  tone: offer.tone,
}));

export function MarketplacePanel({ demoMode = false }: { demoMode?: boolean }) {
  const [offers] = useState<PartnerOffer[]>(OFFERS);
  const [clickedOffer, setClickedOffer] = useState<string | null>(null);

  function handleOfferClick(offer: PartnerOffer) {
    setClickedOffer(offer.id);
    // Recorded in-memory only; nothing leaves the browser and no redirect fires.
    recordAffiliateClick({
      vendorId: offer.id as Parameters<typeof recordAffiliateClick>[0]["vendorId"],
      mode: demoMode ? "demo" : "anonymous",
    });
  }

  return (
    <section className="dashboard-card marketplace-card" id="partners" aria-labelledby="marketplace-heading">
      <span className="label-caps">HIGHER-WELFARE DIRECTORY · KW / GTA PILOT</span>
      <h2 id="marketplace-heading">A curated directory, before any money moves.</h2>
      <p>A hand-checked list of higher-welfare vendors, starting with one region done properly: Kitchener-Waterloo and the GTA. Nothing here pays for placement, and every card shows what we could actually verify—these are placeholders until each vendor is.</p>
      <div className="stub-banner"><span>◎</span> Mock directory entries · no external redirect</div>
      {offers.map((offer) => (
        <button className="marketplace-link" key={offer.id} type="button" onClick={() => handleOfferClick(offer)} aria-label={`Preview ${offer.name} directory entry`}>
          <span className={`marketplace-link-mark ${offer.tone}`}>{offer.mark}</span>
          <span><strong>{offer.name}</strong><span>{offer.detail}</span><span className="marketplace-verification">{offer.verification}</span></span>
          <span className="marketplace-tag">{offer.tag}</span>
          <span className="marketplace-link-arrow" aria-hidden="true">{clickedOffer === offer.id ? "✓" : "↗"}</span>
        </button>
      ))}
      <p className="affiliate-note">Disclosure: Careprint earns nothing from these listings today. If a referral agreement is ever added, the affected card will say so right here—“we may earn a referral fee if you order via this link or code”—and payment will never change ranking or score math.</p>
    </section>
  );
}
