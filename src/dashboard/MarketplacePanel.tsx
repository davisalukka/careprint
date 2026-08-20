"use client";

import { useState } from "react";
import { listMarketplaceOffers, recordAffiliateClick } from "../lib/integration-stubs";

type PartnerOffer = {
  id: string;
  name: string;
  detail: string;
  tag: string;
  mark: string;
  tone: "mint" | "yellow" | "coral";
};

// The static site has no API to call, so the marketplace reads the same local
// fixtures the removed /api/stubs route used to serve. No external requests.
const OFFERS: PartnerOffer[] = listMarketplaceOffers().map((offer) => ({
  id: offer.id,
  name: offer.name,
  detail: offer.detail,
  tag: offer.tag,
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
      <span className="label-caps">PARTNER MARKETPLACE</span>
      <h2 id="marketplace-heading">When you’re ready to shop kinder.</h2>
      <p>These cards are stand-ins until real partnerships exist—live vendor links, affiliate IDs, and inventory stay unplugged for now. When a card goes live, it will say exactly why it earned its place here.</p>
      <div className="stub-banner"><span>◎</span> Mock connector active · no external redirect</div>
      {offers.map((offer) => (
        <button className="marketplace-link" key={offer.id} type="button" onClick={() => handleOfferClick(offer)} aria-label={`Preview ${offer.name} partner offer`}>
          <span className={`marketplace-link-mark ${offer.tone}`}>{offer.mark}</span>
          <span><strong>{offer.name}</strong><span>{offer.detail}</span></span>
          <span className="marketplace-tag">{offer.tag}</span>
          <span className="marketplace-link-arrow" aria-hidden="true">{clickedOffer === offer.id ? "✓" : "↗"}</span>
        </button>
      ))}
      <p className="affiliate-note">Partner disclosure: once affiliate agreements are live, Careprint may earn a commission from qualifying purchases. Paid placement will never change the score or ranking.</p>
    </section>
  );
}
