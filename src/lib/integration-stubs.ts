/**
 * Local-only integration boundary for Careprint's partner marketplace.
 *
 * This module intentionally contains fixtures and an in-memory event store
 * only. It does not import a network client, read environment credentials, or
 * construct a live vendor URL. Replace the functions here with a real
 * connector when the external contracts and affiliate agreements are ready.
 */

export const VENDOR_IDS = [
  "rowe-farms",
  "west-side-beef",
  "northern-raised",
] as const;

export type VendorId = (typeof VENDOR_IDS)[number];
export type TrackedFood = "beef" | "salmon" | "eggs" | "milk";
export type VendorTone = "mint" | "yellow" | "coral";
export type SubscriptionFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "every-6-weeks";

export type VendorAvailability = {
  isAvailable: boolean;
  pickup: boolean;
  delivery: boolean;
  recurringDelivery: boolean;
};

export type VendorSubscription = {
  available: boolean;
  frequencies: readonly SubscriptionFrequency[];
  canSkip: boolean;
  canPause: boolean;
  canCancel: boolean;
  minimumRenewals: number | null;
};

export type VendorFixture = {
  id: VendorId;
  name: string;
  detail: string;
  tag: string;
  mark: string;
  tone: VendorTone;
  products: readonly TrackedFood[];
  availability: VendorAvailability;
  subscription: VendorSubscription;
  affiliate: {
    eligible: boolean;
    disclosure: string;
  };
};

export type VendorMarketplaceOffer = Pick<
  VendorFixture,
  | "id"
  | "name"
  | "detail"
  | "tag"
  | "mark"
  | "tone"
  | "products"
  | "availability"
  | "subscription"
>;

export type VendorAvailabilityFixture = Pick<
  VendorFixture,
  "id" | "name" | "availability"
>;

export type VendorSubscriptionFixture = Pick<
  VendorFixture,
  "id" | "name" | "subscription"
>;

export type AffiliateClickMode = "demo" | "account" | "anonymous";
export type AffiliateClickRequestMode = Exclude<AffiliateClickMode, "anonymous">;

export type AffiliateClickPayload = {
  event: "affiliate_click";
  vendorId: VendorId;
  mode: AffiliateClickRequestMode;
  placement: string | null;
};

export type AffiliateAttribution = {
  source: "chatgpt";
  userId: string;
};

export type AffiliateClickEvent = {
  id: string;
  sequence: number;
  event: "affiliate_click";
  vendorId: VendorId;
  mode: AffiliateClickMode;
  placement: string | null;
  attribution: AffiliateAttribution | null;
};

export type AffiliateClickValidation =
  | { valid: true; value: AffiliateClickPayload }
  | { valid: false; error: string; field?: string };

const VENDOR_FIXTURES: readonly VendorFixture[] = [
  {
    id: "rowe-farms",
    name: "Rowe Farms",
    detail: "Pasture-raised staples · pickup + local delivery",
    tag: "Local pickup",
    mark: "R",
    tone: "mint",
    products: ["beef", "salmon", "eggs", "milk"],
    availability: {
      isAvailable: true,
      pickup: true,
      delivery: true,
      recurringDelivery: false,
    },
    subscription: {
      available: false,
      frequencies: [],
      canSkip: false,
      canPause: false,
      canCancel: false,
      minimumRenewals: null,
    },
    affiliate: {
      eligible: true,
      disclosure:
        "Careprint may earn a commission if a future partner link leads to a qualifying purchase.",
    },
  },
  {
    id: "west-side-beef",
    name: "West Side Beef",
    detail: "Farm-sourced meat + eggs · recurring boxes",
    tag: "Subscription",
    mark: "W",
    tone: "yellow",
    products: ["beef", "eggs"],
    availability: {
      isAvailable: true,
      pickup: false,
      delivery: true,
      recurringDelivery: true,
    },
    subscription: {
      available: true,
      frequencies: ["weekly", "biweekly"],
      canSkip: true,
      canPause: true,
      canCancel: true,
      minimumRenewals: 4,
    },
    affiliate: {
      eligible: true,
      disclosure:
        "Careprint may earn a commission if a future partner link leads to a qualifying purchase.",
    },
  },
  {
    id: "northern-raised",
    name: "Northern Raised",
    detail: "Ocean-aware salmon · subscribe, skip, or swap",
    tag: "Seafood",
    mark: "N",
    tone: "coral",
    products: ["beef", "salmon"],
    availability: {
      isAvailable: true,
      pickup: false,
      delivery: true,
      recurringDelivery: true,
    },
    subscription: {
      available: true,
      frequencies: ["monthly", "every-6-weeks"],
      canSkip: true,
      canPause: true,
      canCancel: true,
      minimumRenewals: null,
    },
    affiliate: {
      eligible: true,
      disclosure:
        "Careprint may earn a commission if a future partner link leads to a qualifying purchase.",
    },
  },
];

const recordedAffiliateClicks: AffiliateClickEvent[] = [];

export function isVendorId(value: unknown): value is VendorId {
  return typeof value === "string" && VENDOR_IDS.includes(value as VendorId);
}

export function getVendorFixture(vendorId: VendorId): VendorFixture {
  const fixture = VENDOR_FIXTURES.find((vendor) => vendor.id === vendorId);
  if (!fixture) throw new Error(`Unknown vendor fixture: ${vendorId}`);
  return cloneVendorFixture(fixture);
}

export function getVendorAvailability(vendorId: VendorId): VendorAvailability {
  return { ...getVendorFixture(vendorId).availability };
}

export function getVendorSubscription(vendorId: VendorId): VendorSubscription {
  const subscription = getVendorFixture(vendorId).subscription;
  return { ...subscription, frequencies: [...subscription.frequencies] };
}

export function listVendorCatalog(): VendorFixture[] {
  return VENDOR_FIXTURES.map(cloneVendorFixture);
}

export function listMarketplaceOffers(): VendorMarketplaceOffer[] {
  return VENDOR_FIXTURES.map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    detail: vendor.detail,
    tag: vendor.tag,
    mark: vendor.mark,
    tone: vendor.tone,
    products: [...vendor.products],
    availability: { ...vendor.availability },
    subscription: {
      ...vendor.subscription,
      frequencies: [...vendor.subscription.frequencies],
    },
  }));
}

export function listVendorAvailability(): VendorAvailabilityFixture[] {
  return VENDOR_FIXTURES.map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    availability: { ...vendor.availability },
  }));
}

export function listVendorSubscriptions(): VendorSubscriptionFixture[] {
  return VENDOR_FIXTURES.map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    subscription: {
      ...vendor.subscription,
      frequencies: [...vendor.subscription.frequencies],
    },
  }));
}

export function validateAffiliateClickPayload(
  value: unknown,
): AffiliateClickValidation {
  if (!isRecord(value)) {
    return { valid: false, error: "Request body must be an object" };
  }

  if (value.event !== "affiliate_click") {
    return {
      valid: false,
      field: "event",
      error: "Only affiliate_click events are supported",
    };
  }

  if (!isVendorId(value.vendorId)) {
    return {
      valid: false,
      field: "vendorId",
      error: "vendorId must identify a known vendor fixture",
    };
  }

  const mode = value.mode === undefined ? "demo" : value.mode;
  if (mode !== "demo" && mode !== "account") {
    return {
      valid: false,
      field: "mode",
      error: "mode must be demo or account",
    };
  }

  let placement: string | null = null;
  if (value.placement !== undefined) {
    if (typeof value.placement !== "string") {
      return {
        valid: false,
        field: "placement",
        error: "placement must be a string",
      };
    }
    placement = value.placement.trim();
    if (placement.length > 80) {
      return {
        valid: false,
        field: "placement",
        error: "placement must be 80 characters or fewer",
      };
    }
    if (placement.length === 0) placement = null;
  }

  return {
    valid: true,
    value: {
      event: "affiliate_click",
      vendorId: value.vendorId,
      mode,
      placement,
    },
  };
}

export function recordAffiliateClick(input: {
  vendorId: VendorId;
  mode: AffiliateClickMode;
  placement?: string | null;
  attribution?: AffiliateAttribution | null;
}): AffiliateClickEvent {
  const sequence = recordedAffiliateClicks.length + 1;
  const event: AffiliateClickEvent = {
    id: `click-${String(sequence).padStart(4, "0")}`,
    sequence,
    event: "affiliate_click",
    vendorId: input.vendorId,
    mode: input.mode,
    placement: input.placement ?? null,
    attribution: input.attribution ? { ...input.attribution } : null,
  };

  recordedAffiliateClicks.push(event);
  return cloneAffiliateClickEvent(event);
}

export function listRecordedAffiliateClicks(): AffiliateClickEvent[] {
  return recordedAffiliateClicks.map(cloneAffiliateClickEvent);
}

export function clearRecordedAffiliateClicks(): void {
  recordedAffiliateClicks.length = 0;
}

function cloneVendorFixture(vendor: VendorFixture): VendorFixture {
  return {
    ...vendor,
    products: [...vendor.products],
    availability: { ...vendor.availability },
    subscription: {
      ...vendor.subscription,
      frequencies: [...vendor.subscription.frequencies],
    },
    affiliate: { ...vendor.affiliate },
  };
}

function cloneAffiliateClickEvent(event: AffiliateClickEvent): AffiliateClickEvent {
  return {
    ...event,
    attribution: event.attribution ? { ...event.attribution } : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
