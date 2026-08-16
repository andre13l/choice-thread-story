import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { SITE } from "@/config/site";

/**
 * Platform navigation. One brand anchor and one menu — no row of competing
 * labels. Hidden entirely on full-screen game routes (see __root.tsx).
 */
const MENU: { label: string; to: string; exact?: boolean; group: "play" | "more" }[] = [
  { label: "Games", to: "/", exact: true, group: "play" },
  { label: "Daily", to: "/daily", group: "play" },
  { label: "Hollywood", to: "/hollywood", group: "play" },
  { label: "Connect", to: "/connect", group: "play" },
  { label: "Higher / Lower", to: "/higher-lower", group: "play" },
  { label: "Walk of Fame", to: "/walk-of-fame", group: "more" },
  { label: "About", to: "/about", group: "more" },
  { label: "Contact", to: "/contact", group: "more" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape + outside click.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div
        ref={wrapRef}
        className="relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-8"
      >
        <Link
          to="/"
          className="font-display text-[13px] font-bold tracking-[0.4em] text-foreground transition-opacity hover:opacity-80"
        >
          {SITE.name}
        </Link>

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex items-center gap-2 border border-border/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground"
        >
          {open ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{open ? "Close" : "Menu"}</span>
        </button>

        {open && (
          <div
            id={panelId}
            className="anim-fade-up absolute right-0 top-full z-50 w-full border-b border-l border-r border-border/70 bg-background/98 backdrop-blur-md sm:w-72 sm:border"
          >
            <nav className="flex flex-col px-5 py-5 sm:px-6">
              <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground/60">
                Play
              </p>
              {MENU.filter((m) => m.group === "play").map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.exact ?? false }}
                  onClick={() => setOpen(false)}
                  className="mt-3 text-[13px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "text-foreground" }}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-6 h-px w-full bg-border/60" />
              <p className="mt-5 text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground/60">
                More
              </p>
              {MENU.filter((m) => m.group === "more").map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="mt-3 text-[12px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "text-foreground" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
