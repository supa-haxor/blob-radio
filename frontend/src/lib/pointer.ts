import type { MouseEvent, TouchEvent } from 'react';

/** Client coordinates from a mouse or touch event (first touch). */
export function getClientPointFromEvent(
  e: MouseEvent | TouchEvent
): { clientX: number; clientY: number } {
  if ('touches' in e) {
    const t = e.touches[0];
    return { clientX: t.clientX, clientY: t.clientY };
  }
  return { clientX: e.clientX, clientY: e.clientY };
}
