"use client";

import { useEffect, useState } from "react";

type PartnerOffer = {
  id: string;
  name: string;
  detail: string;
  tag: string;
  mark: string;
  tone: "mint" | "yellow" | "coral";
};

const FALLBACK_OFFERS: PartnerOffer[] = [
  { id: "rowe-farms", name: "Rowe Farms", detail: "Pasture-raised staples · pickup + local delivery", tag: "Local pickup", mark: "R", tone: "mint" },
  { id: "west-side-beef", name: "West Side Beef", detail: "Farm-sourced meat + eggs · recurring boxes", tag: "Subscription", mark: "W", tone: "yellow" },
  { id: "northern-raised", name: "Northern Raised", detail: "Ocean-aware salmon · subscribe, skip, or swap", tag: "Seafood", mark: "N", tone: "coral" },
];

export function MarketplacePanel({ demoMode = false }: { demoMode?: boolean }) {
  const [offers, setOffers] = useState<PartnerOffer[]>(FALLBACK_OFFERS);
  const [clickedOffer, setClickedOffer] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/stubs?kind=vendors")
      .then(async (response) => {
        if (!response.ok) throw new Error("Stub unavailable");
        return response.json() as Promise<{ offers?: PartnerOffer[] }>;
      })
      .then((payload) => {
        if (active && payload.offers?.length) setOffers(payload.offers);
      })
      .catch(() => {
        // The local fallback is intentional: no live vendor service is required for the MVP.
      });
    return () => { active = false; };
  }, []);

  async function handleOfferClick(offer: PartnerOffer) {
    setClickedOffer(offer.id);
    try {
      await fetch("/api/stubs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "affiliate_click", vendorId: offer.id, mode: demoMode ? "demo" : "account" }),
      });
    } catch {
      // Keep the interaction usable even when the stub route is unavailable.
    }
  }

  return (
    <section className="dashboard-card marketplace-card" id="partners" aria-labelledby="marketplace-heading">
      <span className="label-caps">PARTNER MARKETPLACE</span>
      <h2 id="marketplace-heading">Lower-footprint shopping, in one place.</h2>
      <p>These are mock partner cards for the MVP. Live vendor links, affiliate IDs, and inventory feeds stay behind this boundary until they are connected.</p>
      <div className="stub-banner"><span>◎</span> Mock connector active · no external redirect</div>
      {offers.map((offer) => (
        <button className="marketplace-link" key={offer.id} type="button" onClick={() => void handleOfferClick(offer)} aria-label={`Preview ${offer.name} partner offer`}>
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
