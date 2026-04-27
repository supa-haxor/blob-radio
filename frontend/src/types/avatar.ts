export interface AvatarPathPoint {
  x: number;
  y: number;
}

/** Client-side avatar state (room + movement + actions). */
export interface Avatar {
  id: string;
  x: number;
  y: number;
  color: string;
  isWalking?: boolean;
  targetX?: number;
  targetY?: number;
  startTime?: number;
  isDancing?: boolean;
  isGreeting?: boolean;
  isJumping?: boolean;
  isMeditating?: boolean;
  isSleeping?: boolean;
  /** Chat-only `/die` — flat on floor, X eyes. */
  isDead?: boolean;
  path?: AvatarPathPoint[];
  name?: string;
  isSqueezed?: boolean;
}

export interface RoomState {
  avatars: Record<string, Avatar>;
}
