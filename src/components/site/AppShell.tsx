import { useRouterState } from "@tanstack/react-router";
import { useEffect, useId, useState, type ReactNode } from "react";
import { SITE } from "@/config/site";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SidebarNav } from "./SiteSidebar";

const NAV_KEY = `${SITE.storagePrefix}.nav.open`;

/** Routes rendered inside the centered game sheet. */
const SURFACE_PREFIXES = ["/daily", "/connect", "/higher-lower"];
/** Full-bleed cinematic route — keeps the shell, drops the sheet frame. */
const FULL_BLEED_PREFIXES = ["/hollywood"];

/**
 * Platform shell shared by every route: header, navigation (a pushing rail
 * on desktop, a drawer on mobile), the content column and the footer.
 * Opening the rail resizes the content column instead of covering it.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // Restore the desktop rail preference after hydration.
  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(NAV_KEY) === "1" && window.innerWidth >= 1024);
    } catch {
      // Preference is a nicety.
    }
    setReady(true);
  }, []);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(NAV_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  // The drawer must never survive a navigation on small screens.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) setOpen(false);
  }, [pathname]);

  const framed = SURFACE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const fullBleed = FULL_BLEED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader navOpen={open} onToggleNav={toggle} navPanelId={panelId} />

      <div className="relative flex flex-1">
        {/* Desktop rail — pushes the content column. */}
        <aside
          id={panelId}
          aria-hidden={!open}
          className={`hidden shrink-0 overflow-hidden border-r border-border/70 bg-sidebar lg:block ${
            ready ? "transition-[width] duration-300 ease-out" : ""
          } ${open ? "w-60" : "w-0 border-r-0"}`}
        >
          <div className="sticky top-14 w-60">{open && <SidebarNav />}</div>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={toggle}
              className="fixed inset-0 top-14 z-40 bg-foreground/25"
            />
            <div className="anim-fade-in fixed inset-y-14 left-0 z-50 w-64 overflow-y-auto border-r border-border bg-sidebar">
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex min-w-0 flex-1 flex-col">
            {framed ? (
              <div className="mx-auto w-full max-w-3xl px-3 py-5 sm:px-6 sm:py-10">
                <div className="game-surface">{children}</div>
              </div>
            ) : fullBleed ? (
              children
            ) : (
              children
            )}
          </main>
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
