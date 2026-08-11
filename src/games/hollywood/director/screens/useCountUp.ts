import { useEffect, useRef, useState } from "react";

/** Animated number reveal. Eases out so the last digits land slowly. */
export function useCountUp(target: number, duration = 1600, active = true): number {
  const [value, setValue] = useState(active ? 0 : target);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration, active]);

  return value;
}
