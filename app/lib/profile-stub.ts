import type { Profile } from "./footprint-model";

type StoredProfile = { profile: Profile; updatedAt: string };

// Local-only persistence seam. Replace this Map with D1, Postgres, or a
// customer-data connector once the product has a real backend contract.
const profiles = new Map<string, StoredProfile>();

export function readProfile(userId: string): Profile | null {
  return profiles.get(userId)?.profile ?? null;
}

export function writeProfile(userId: string, profile: Profile): StoredProfile {
  const stored = { profile, updatedAt: new Date().toISOString() };
  profiles.set(userId, stored);
  return stored;
}
