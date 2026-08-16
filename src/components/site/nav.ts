/**
 * Single source of truth for platform navigation. Only real, shipped
 * destinations live here — the sidebar, the mobile drawer and the footer
 * all read from this list so they can never drift apart.
 */
export interface NavItem {
  label: string;
  to: string;
  exact?: boolean;
  group: "play" | "more";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", to: "/", exact: true, group: "play" },
  { label: "Daily", to: "/daily", group: "play" },
  { label: "Hollywood", to: "/hollywood", group: "play" },
  { label: "Connect", to: "/connect", group: "play" },
  { label: "Higher or Lower", to: "/higher-lower", group: "play" },
  { label: "Walk of Fame", to: "/walk-of-fame", group: "more" },
  { label: "About", to: "/about", group: "more" },
  { label: "Contact", to: "/contact", group: "more" },
];
