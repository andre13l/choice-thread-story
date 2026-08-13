/**
 * Site identity — provisional by design.
 *
 * The final product name/domain will be chosen later. Everything
 * user-visible (titles, metadata, share text, storage keys) reads from
 * here so a rebrand is a one-line change, not a refactor.
 *
 * NOTE: `storagePrefix` is ALSO the compatibility layer for existing
 * players — localStorage keys were originally written under "paths.v1".
 * Changing it orphans saved careers, so it only changes alongside a
 * deliberate key-migration, never as part of a cosmetic rename.
 */
export const SITE = {
  name: "NIRCOSI",
  tagline: "Every choice changes your path.",
  description:
    "A collection of short, highly replayable cinema and pop-culture games. How far can you make it?",
  /** localStorage namespace. Keep stable — see note above. */
  storagePrefix: "paths.v1",
  /**
   * Contact address rendered on /contact. Intentionally empty until a real
   * inbox exists — the page explains instead of inventing one.
   */
  contactEmail: "",
  /**
   * Social profiles for the footer. An empty url means the profile is not
   * live yet; the footer only renders profiles with a configured url.
   * No placeholders are shown for accounts that don't exist.
   */
  socials: [] as { label: string; url: string }[],
} as const;
