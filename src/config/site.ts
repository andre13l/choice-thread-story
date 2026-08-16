/**
 * Site identity.
 *
 * The platform brand is NIRCOSI. Everything
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
   * Social profiles for the footer. An empty url means the account exists as
   * a plan, not a page — the footer shows the label as "soon" and never
   * renders a dead link. Fill the url in once the profile is live.
   */
  socials: [
    { label: "Instagram", url: "" },
    { label: "TikTok", url: "" },
  ] as { label: string; url: string }[],
} as const;
