import { GRAPH, type GraphNode } from "../graph";

/**
 * Breadcrumb of the route so far. Horizontally scrollable on mobile.
 */
export function PathTrail({
  path,
  onJump,
}: {
  path: GraphNode[];
  onJump?: (index: number) => void;
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max items-center gap-2 py-1">
        {path.map((node, i) => {
          const label =
            node.kind === "person"
              ? GRAPH.peopleById[node.id]!.name
              : GRAPH.moviesById[node.id]!.title;
          const last = i === path.length - 1;
          return (
            <div key={`${node.kind}-${node.id}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span className="text-[11px] text-muted-foreground/50">→</span>}
              <button
                type="button"
                disabled={!onJump || last}
                onClick={() => onJump?.(i)}
                className={[
                  "whitespace-nowrap border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] transition-colors",
                  last
                    ? "border-link/60 bg-link/10 text-link"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                  node.kind === "movie" ? "italic" : "",
                ].join(" ")}
              >
                {label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
