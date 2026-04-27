import type { Avatar as ClientAvatar } from '../types/avatar';
import { constrainToFloor } from './room';

const Z_STRIDE = 512;

function idTieSuffix(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h % Z_STRIDE;
}

/**
 * Solo / legacy: pseudo-3D from `y` + id tie. Prefer {@link computeAvatarStackZIndices} in-room.
 */
export function avatarStackZIndex(y: number, id: string): number {
  return Math.floor(y) * Z_STRIDE + idTieSuffix(id);
}

/**
 * z-index from depth rank among all avatars (sort by `y`, then `id`). Value only
 * changes when you cross another blob’s `y` (or swap id order at the same `y`).
 */
export function computeAvatarStackZIndices(avatars: ClientAvatar[]): Record<string, number> {
  const sorted = [...avatars].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.id.localeCompare(b.id);
  });
  const out: Record<string, number> = {};
  sorted.forEach((a, rank) => {
    out[a.id] = rank * Z_STRIDE + idTieSuffix(a.id);
  });
  return out;
}

/** Stable list order (by id); depth is from {@link computeAvatarStackZIndices} (passed as `stackZIndex`). */
export function sortAvatarsStableById(avatars: ClientAvatar[]): ClientAvatar[] {
  return [...avatars].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Applies server avatar list + floor constraint, preserving local self position
 * and walking state from the movement system (same rules as previous inline logic).
 */
export function mergeServerAvatarBroadcast(
  incoming: ClientAvatar[],
  previous: ClientAvatar[],
  selfId: string,
  isSelfMoving: boolean
): ClientAvatar[] {
  return incoming.map((avatar) => {
    const constrainedPos = constrainToFloor(avatar.x, avatar.y);

    if (avatar.id === selfId) {
      const existingAvatar = previous.find((a) => a.id === selfId);

      if (existingAvatar) {
        return {
          ...avatar,
          x: existingAvatar.x,
          y: existingAvatar.y,
          isWalking: isSelfMoving,
          color: avatar.color,
          name: avatar.name,
        };
      }

      return {
        ...avatar,
        x: constrainedPos.x,
        y: constrainedPos.y,
        isWalking: isSelfMoving,
        color: avatar.color,
        name: avatar.name,
      };
    }

    return {
      ...avatar,
      x: constrainedPos.x,
      y: constrainedPos.y,
      isWalking: avatar.isWalking ?? false,
      name: avatar.name || 'Anonymous',
    };
  });
}

export function mapSelfSqueeze(
  prev: ClientAvatar[],
  selfId: string,
  squeezed: boolean
): ClientAvatar[] {
  return prev.map((a) => {
    if (a.id !== selfId) return a;
    if (!squeezed) return { ...a, isSqueezed: false };
    return {
      ...a,
      isSqueezed: true,
      isDancing: false,
      isMeditating: false,
      isSleeping: false,
      isGreeting: false,
      isJumping: false,
      isDead: false,
    };
  });
}

export function setSelfWalkingTrue(
  prev: ClientAvatar[],
  selfId: string
): ClientAvatar[] {
  return prev.map((avatar) =>
    avatar.id === selfId ? { ...avatar, isWalking: true } : avatar
  );
}

export function applySelfMovementStep(
  prev: ClientAvatar[],
  selfId: string,
  x: number,
  y: number,
  isWalking: boolean
): ClientAvatar[] {
  return prev.map((avatar) =>
    avatar.id === selfId ? { ...avatar, x, y, isWalking } : avatar
  );
}

export function appendAvatarIfNew(
  prev: ClientAvatar[],
  avatar: ClientAvatar
): ClientAvatar[] {
  if (prev.some((a) => a.id === avatar.id)) return prev;
  return [...prev, avatar];
}
