import type { Avatar as ClientAvatar } from '../types/avatar';
import { constrainToFloor } from './room';

/** Lower Y renders in front (pseudo-3D). */
export function sortAvatarsByDepth(avatars: ClientAvatar[]): ClientAvatar[] {
  return [...avatars].sort((a, b) => a.y - b.y);
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
      isGreeting: false,
      isJumping: false,
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
