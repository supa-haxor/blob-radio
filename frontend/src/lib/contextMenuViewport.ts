import {
  estimatedContextMenuHeightOtherUserPx,
  estimatedContextMenuHeightSelfPx,
  estimatedContextMenuWidthPx,
} from '../config/roomUi';

const VIEWPORT_MARGIN_PX = 8;

export type ContextMenuViewportKind = 'self' | 'otherUser';

function menuSize(kind: ContextMenuViewportKind) {
  return {
    w: estimatedContextMenuWidthPx,
    h:
      kind === 'self'
        ? estimatedContextMenuHeightSelfPx
        : estimatedContextMenuHeightOtherUserPx,
  };
}

/**
 * Keeps a `position: fixed` context menu inside the viewport.
 * Uses realistic heights so “other user” compact menus are not pushed upward as if they were full action menus.
 */
export function clampFixedContextMenuPosition(
  clientX: number,
  clientY: number,
  kind: ContextMenuViewportKind
): { x: number; y: number } {
  const { w, h } = menuSize(kind);
  const maxX = window.innerWidth - w - VIEWPORT_MARGIN_PX;
  const maxY = window.innerHeight - h - VIEWPORT_MARGIN_PX;

  let x = clientX;
  let y = clientY;

  if (x > maxX) x = maxX;
  if (y > maxY) y = maxY;
  if (x < VIEWPORT_MARGIN_PX) x = VIEWPORT_MARGIN_PX;
  if (y < VIEWPORT_MARGIN_PX) y = VIEWPORT_MARGIN_PX;

  return { x, y };
}
