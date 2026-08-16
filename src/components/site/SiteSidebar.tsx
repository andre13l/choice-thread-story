import { Link } from "@tanstack/react-router";
import { NAV_ITEMS } from "./nav";

/**
 * Navigation rail content. Rendered inside the desktop push-rail and inside
 * the mobile drawer, so both surfaces always list the same real routes.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const play = NAV_ITEMS.filter((i) => i.group === "play");
  const more = NAV_ITEMS.filter((i) => i.group === "more");

  return (
    <nav aria-label="Site" className="flex w-full flex-col gap-8 px-5 py-7">
      <Group title="Play" items={play} onNavigate={onNavigate} />
      <Group title="More" items={more} onNavigate={onNavigate} />
    </nav>
  );
}

function Group({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: typeof NAV_ITEMS;
  onNavigate?: (() => void) | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="mb-2 px-3 text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground/70">
        {title}
      </p>
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.exact ?? false }}
          onClick={onNavigate}
          className="rounded-sm px-3 py-2 text-[13px] tracking-[0.04em] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          activeProps={{
            className: "bg-accent/70 text-foreground font-medium",
          }}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
