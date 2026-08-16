import { Link } from "@tanstack/react-router";
import { SITE } from "@/config/site";

/**
 * Editorial footer. Social profiles render as links only once a real URL is
 * configured in SITE.socials — pending accounts stay as quiet labels rather
 * than dead links.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] sm:gap-12">
          <div className="min-w-0">
            <p className="font-display text-[13px] font-bold tracking-[0.4em] text-foreground">
              {SITE.name}
            </p>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Games for movie lovers.
            </p>
          </div>

          <FooterColumn title="Games">
            <FooterLink to="/daily">Daily</FooterLink>
            <FooterLink to="/hollywood">Hollywood</FooterLink>
            <FooterLink to="/connect">Connect</FooterLink>
            <FooterLink to="/higher-lower">Higher or Lower</FooterLink>
          </FooterColumn>

          <FooterColumn title="Community">
            <FooterLink to="/walk-of-fame">Walk of Fame</FooterLink>
            <FooterLink to="/about">About</FooterLink>
            {SITE.socials.map((s) =>
              s.url ? (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {s.label}
                </a>
              ) : (
                <span key={s.label} className="text-[13px] text-muted-foreground/50">
                  {s.label} — soon
                </span>
              ),
            )}
          </FooterColumn>

          <FooterColumn title="Support">
            <FooterLink to="/contact">Contact</FooterLink>
            <FooterLink to="/privacy">Privacy</FooterLink>
            <FooterLink to="/terms">Terms</FooterLink>
          </FooterColumn>
        </div>

        <p className="mt-14 border-t border-border/60 pt-6 text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
          © {new Date().getFullYear()} {SITE.name} — a collection of cinema games
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="mb-1 text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground/70">
        {title}
      </span>
      {children}
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}
