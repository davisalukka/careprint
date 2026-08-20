import { getChatGPTUser } from "../../chatgpt-auth";
import { cloneProfile, DEFAULT_PROFILE, type Profile } from "../../../app/lib/footprint-model";
import { readProfile, writeProfile } from "../../../app/lib/profile-stub";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign-in required" }, { status: 401 });

  return Response.json({
    profile: readProfile(user.userId),
    account: { displayName: user.displayName, email: user.email },
    integration: "local-profile-stub",
  });
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign-in required" }, { status: 401 });

  try {
    const body = (await request.json()) as { profile?: unknown };
    const profile = normalizeProfile(body.profile);
    if (!profile) return Response.json({ error: "Invalid profile" }, { status: 400 });
    if (JSON.stringify(profile).length > 20_000) return Response.json({ error: "Profile is too large" }, { status: 413 });

    writeProfile(user.userId, profile);
    return Response.json({ saved: true, integration: "local-profile-stub" });
  } catch {
    return Response.json({ error: "Invalid profile payload" }, { status: 400 });
  }
}

function normalizeProfile(value: unknown): Profile | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<Profile>;
  if (!candidate.servings || !candidate.sources) return null;
  const profile = cloneProfile(DEFAULT_PROFILE);
  for (const key of ["beef", "salmon", "eggs", "milk"] as const) {
    const servings = candidate.servings[key];
    const source = candidate.sources[key];
    if (typeof servings !== "number" || servings < 0 || servings > 3) return null;
    if (typeof source !== "string") return null;
    profile.servings[key] = servings;
    profile.sources[key] = source as Profile["sources"][typeof key];
  }
  return profile;
}
