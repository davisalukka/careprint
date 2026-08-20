import { getChatGPTUser } from "../../chatgpt-auth";
import {
  listMarketplaceOffers,
  listVendorAvailability,
  listVendorCatalog,
  listVendorSubscriptions,
  recordAffiliateClick,
  validateAffiliateClickPayload,
} from "../../lib/integration-stubs";

const SUPPORTED_FIXTURES = ["vendors", "availability", "subscriptions"] as const;

export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind") ?? "vendors";

  if (kind === "vendors") {
    return Response.json({
      kind,
      offers: listMarketplaceOffers(),
      catalog: listVendorCatalog(),
      integration: "local-vendor-stub",
    });
  }

  if (kind === "availability") {
    return Response.json({
      kind,
      vendors: listVendorAvailability(),
      integration: "local-vendor-availability-stub",
    });
  }

  if (kind === "subscriptions") {
    return Response.json({
      kind,
      vendors: listVendorSubscriptions(),
      integration: "local-vendor-subscription-stub",
    });
  }

  return Response.json(
    {
      error: "Unknown fixture kind",
      supportedKinds: SUPPORTED_FIXTURES,
    },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const validation = validateAffiliateClickPayload(body);
  if (!validation.valid) {
    return Response.json(
      { error: validation.error, field: validation.field ?? null },
      { status: 400 },
    );
  }

  const user = await safeGetChatGPTUser();
  const event = recordAffiliateClick({
    vendorId: validation.value.vendorId,
    mode: user ? validation.value.mode : "anonymous",
    placement: validation.value.placement,
    attribution: user
      ? { source: "chatgpt", userId: user.userId.slice(0, 128) }
      : null,
  });

  return Response.json(
    {
      accepted: true,
      event,
      integration: "local-affiliate-click-stub",
    },
    { status: 201 },
  );
}

async function safeGetChatGPTUser() {
  try {
    return await getChatGPTUser();
  } catch {
    return null;
  }
}
