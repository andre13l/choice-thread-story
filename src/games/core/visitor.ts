/**
 * Stable opaque visitor id, so an anonymous player can hold one ranked slot
 * per daily without an account. Never rendered, never used as a display name —
 * leaderboards derive "Guest ABCD" from the row id instead.
 */
import { SITE } from "@/config/site";

const KEY = `${SITE.storagePrefix}.visitor`;

export function visitorKey(): string | null {
  try {
    let existing = window.localStorage.getItem(KEY);
    if (!existing || existing.length < 8) {
      existing = crypto.randomUUID().replace(/-/g, "");
      window.localStorage.setItem(KEY, existing);
    }
    return existing;
  } catch {
    return null;
  }
}
