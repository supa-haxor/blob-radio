import { useLayoutEffect, useRef, useState } from 'react';

/** Keep in sync with `.avatar-container { transition: transform … }` in App.css */
export const AVATAR_CONTAINER_TRANSFORM_MS = 500;

type YNode = { id: string; y: number };

/**
 * Linearly interpolates each avatar’s `y` toward store values over the same duration
 * as the avatar transform CSS transition, so depth / z-index tracks what the eye sees
 * without changing movement or transform behavior.
 */
export function useSmoothedYForDepthOrder(
  nodes: YNode[],
  durationMs: number = AVATAR_CONTAINER_TRANSFORM_MS
): Record<string, number> {
  const [smoothed, setSmoothed] = useState<Record<string, number>>({});
  const smoothedRef = useRef<Record<string, number>>({});
  const lastTargetRef = useRef<Record<string, number>>({});
  const animFromRef = useRef<Record<string, number>>({});
  const animStartRef = useRef<Record<string, number>>({});
  const rafRef = useRef<number>(0);

  useLayoutEffect(() => {
    const now = performance.now();
    const ids = new Set(nodes.map((n) => n.id));

    for (const { id, y } of nodes) {
      const last = lastTargetRef.current[id];
      if (last === undefined) {
        lastTargetRef.current[id] = y;
        smoothedRef.current[id] = y;
        continue;
      }
      if (last !== y) {
        animFromRef.current[id] = smoothedRef.current[id] ?? last;
        animStartRef.current[id] = now;
        lastTargetRef.current[id] = y;
      }
    }

    for (const id of Object.keys(lastTargetRef.current)) {
      if (!ids.has(id)) {
        delete lastTargetRef.current[id];
        delete smoothedRef.current[id];
        delete animFromRef.current[id];
        delete animStartRef.current[id];
      }
    }

    const tick = () => {
      const t = performance.now();
      const next: Record<string, number> = {};
      let animating = false;

      for (const { id } of nodes) {
        const target = lastTargetRef.current[id];
        const t0 = animStartRef.current[id];
        const from = animFromRef.current[id];

        if (from === undefined || t0 === undefined) {
          next[id] = target;
          continue;
        }

        const u = Math.min(1, (t - t0) / durationMs);
        next[id] = from + (target - from) * u;
        if (u < 1) animating = true;
        if (u >= 1) {
          delete animFromRef.current[id];
          delete animStartRef.current[id];
        }
      }

      smoothedRef.current = next;
      setSmoothed(next);

      if (animating) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [nodes, durationMs]);

  return smoothed;
}
