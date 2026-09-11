/**
 * Shared affiliate / partnership copy.
 *
 * Keep this language in one place so the landing CTA, directory cards, and
 * methodology page cannot drift. Paid placement must never touch score math
 * or ranking — that invariant is product copy, not a scoring input.
 */

/** README / Ad Standards plain-language disclosure, used adjacent to vendor cards. */
export const REFERRAL_FEE_DISCLOSURE =
  "we may earn a referral fee if you order via this link or code";

/** Shown next to every vendor recommendation while the directory is unmonetized. */
export const UNAFFILIATED_CARD_NOTE = `Careprint earns nothing from this listing today. If a referral agreement is added, this card will say so here — “${REFERRAL_FEE_DISCLOSURE}.”`;

/** Permanent product rule. Must stay visible near recommendations. */
export const PLACEMENT_INVARIANT =
  "Paid placement never changes score math or vendor ranking.";
