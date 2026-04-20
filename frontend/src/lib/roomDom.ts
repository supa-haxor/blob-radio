/**
 * DOM helpers for the room layout (class names match CSS).
 * Keeps querySelector strings in one place.
 */

export function getContextMenuElement(): Element | null {
  return document.querySelector('.context-menu');
}

export function getRoomElement(): Element | null {
  return document.querySelector('.room');
}

export function getRoomBottomElement(): Element | null {
  return document.querySelector('.room-bottom');
}

export function isClientPointInsideContextMenu(
  clientX: number,
  clientY: number
): boolean {
  const contextMenu = getContextMenuElement();
  if (!contextMenu) return false;
  const menuRect = contextMenu.getBoundingClientRect();
  return (
    clientX >= menuRect.left &&
    clientX <= menuRect.right &&
    clientY >= menuRect.top &&
    clientY <= menuRect.bottom
  );
}

export function getPointRelativeToRoom(
  clientX: number,
  clientY: number
): { x: number; y: number } | null {
  const roomElement = getRoomElement();
  if (!roomElement) return null;
  const rect = roomElement.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

export function getPointRelativeToRoomBottom(
  clientX: number,
  clientY: number
): { x: number; y: number } | null {
  const bottom = getRoomBottomElement();
  if (!bottom) return null;
  const rect = bottom.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}
