/**
 * Room / floor geometry for the bottom canvas (1000×500, perspective floor).
 */

export const ROOM_CANVAS_WIDTH = 1000;
export const ROOM_CANVAS_HEIGHT = 500;

const SPAWN_MARGIN = 50;

export function constrainToFloor(x: number, y: number): { x: number; y: number } {
  const floorTopLeft = { x: 200, y: 250 };
  const floorTopRight = { x: 800, y: 250 };
  const floorBottomRight = { x: 1000, y: 500 };
  const floorBottomLeft = { x: 0, y: 500 };

  if (y < floorTopLeft.y) {
    y = floorTopLeft.y;
    x = Math.max(floorTopLeft.x, Math.min(x, floorTopRight.x));
  }

  if (y > floorBottomLeft.y) {
    y = floorBottomLeft.y;
  }

  const progress = (y - floorTopLeft.y) / (floorBottomLeft.y - floorTopLeft.y);
  const leftBound = floorTopLeft.x + (floorBottomLeft.x - floorTopLeft.x) * progress;
  const rightBound = floorTopRight.x + (floorBottomRight.x - floorTopRight.x) * progress;

  x = Math.max(leftBound, Math.min(x, rightBound));

  return { x, y };
}

export function getRandomPosition(): { x: number; y: number } {
  const x =
    Math.random() * (ROOM_CANVAS_WIDTH - 2 * SPAWN_MARGIN) + SPAWN_MARGIN;
  const y =
    Math.random() * (ROOM_CANVAS_HEIGHT - 2 * SPAWN_MARGIN) + SPAWN_MARGIN;
  return constrainToFloor(x, y);
}
