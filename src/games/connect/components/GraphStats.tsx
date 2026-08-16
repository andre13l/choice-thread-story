import { useEffect, useState } from "react";
import { getCatalogCounts, type CatalogCounts } from "@/lib/connect.functions";
import type { Graph } from "../data/dataset";

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Live catalogue size. Reads the backend counts view; if that call fails we
 * fall back to counting the loaded snapshot rather than showing nothing.
 * Nothing here is hardcoded.
 */
export function GraphStats({ graph }: { graph: Graph }) {
  const [counts, setCounts] = useState<CatalogCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCatalogCounts()
      .then((live) => {
        if (!cancelled && live && live.films > 0) setCounts(live);
      })
      .catch(() => {
        // Snapshot fallback below.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const films = counts?.films ?? graph.counts.films;
  const people = counts?.people ?? graph.counts.people;
  const connections = counts?.connections ?? graph.counts.connections;

  return (
    <div className="mt-14 w-full max-w-md border-t border-border/60 pt-6">
      <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-muted-foreground/80">
        The NIRCOSI film graph
      </p>
      <p className="mt-2 font-display text-[13px] tracking-[0.08em] text-foreground/90">
        {fmt(films)} films · {fmt(people)} actors · {fmt(connections)} connections
      </p>
    </div>
  );
}
