import { Link } from "@tanstack/react-router";
import { SITE } from "@/config/site";

/**
 * Platform navigation. Slim, cinematic, always dark. Hidden entirely on
 * full-screen game routes (see src/routes/__root.tsx).
 */
const NAV = [
  { label: "Games", to: "/", exact: true },
  { label: "Daily", to: "/daily", exact: false },
  { label: "Walk of Fame", to: "/walk-of-fame", exact: false },
  { label: "About", to: "/about", exact: false },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          to="/"
          className="font-display text-[13px] font-bold tracking-[0.4em] text-foreground transition-opacity hover:opacity-80"
        >
          {SITE.name}
        </Link>
        <nav className="flex items-center gap-5 sm:gap-8">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground sm:text-[11px]"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
