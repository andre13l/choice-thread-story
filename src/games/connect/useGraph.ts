import { useCallback, useEffect, useState } from "react";
import { loadGraph, type Graph } from "./data/dataset";

export interface GraphState {
  graph: Graph | null;
  error: string | null;
  retry: () => void;
}

/** Loads the catalogue snapshot once, with an explicit error + retry path. */
export function useGraph(): GraphState {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void loadGraph()
      .then((loaded) => {
        if (!cancelled) setGraph(loaded);
      })
      .catch(() => {
        if (!cancelled) setError("We couldn't load the film graph.");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { graph, error, retry };
}
