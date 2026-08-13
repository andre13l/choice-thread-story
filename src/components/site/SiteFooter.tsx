import { Link } from "@tanstack/react-router";
import { GAMES } from "@/config/games";
import { SITE } from "@/config/site";

/**
 * Platform footer. Game links derive from the registry so a rebrand or a
 * new playable game never requires touching this file. Social profiles
 * render only when configured in SITE.socials — no invented accounts.
 */
export function SiteFooter() {
  const playable = GAMES.filter((g) => g.status === "playable" && g.to);
  const socials = SITE.socials.filter((s) => s.url);

  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div>
            <p className="font-display text-[13px] font-bold tracking-[0.4em] text-foreground">
              {SITE.name}
            </p>
            <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-muted-foreground">
              {SITE.tagline}
            </p>
          </div>

          <nav className="flex gap-14 sm:gap-16">
            <div className="flex flex-col gap-2.5">
              <span className="mb-1 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground/70">
                Games
              </span>
              {playable.map((g) => (
                <Link
                  key={g.id}
                  to={g.to!}
                  className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {g.name.charAt(0) + g.name.slice(1).toLowerCase()}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="mb-1 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground/70">
                Platform
              </span>
              <Link
                to="/walk-of-fame"
                className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Walk of Fame
              </Link>
              <Link
                to="/about"
                className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                About
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="mb-1 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground/70">
                Legal
              </span>
              <Link
                to="/privacy"
                className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                to="/contact"
                className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Contact
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
            © {new Date().getFullYear()} {SITE.name} — a collection of cinema games
          </p>
          {socials.length > 0 && (
            <div className="flex gap-5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60 transition-colors hover:text-foreground"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
