import { useEffect, useRef } from 'react';
import { MovementSystem } from '../movement';
import { emitAvatarPositionOnly } from '../socket';
import { useAvatars } from '../store/AvatarsStore';
import { useMySession } from '../store/MySessionStore';
import { constrainToFloor, getRandomPosition } from '../lib/room';
import { applySelfMovementStep } from '../lib/avatars';

export function useRoomMovement(showWelcome: boolean) {
  const { selfId } = useMySession();
  const { avatars, setAvatars } = useAvatars();
  const movementSystemRef = useRef<MovementSystem | null>(null);

  useEffect(() => {
    if (selfId && !showWelcome) {
      if (!movementSystemRef.current) {
        const currentAvatar = avatars.find((a) => a.id === selfId);
        const initialPos = currentAvatar
          ? { x: currentAvatar.x, y: currentAvatar.y }
          : getRandomPosition();

        movementSystemRef.current = new MovementSystem(initialPos, (position) => {
          const constrainedPos = constrainToFloor(position.x, position.y);
          const isMoving = movementSystemRef.current?.isMoving || false;

          emitAvatarPositionOnly(constrainedPos.x, constrainedPos.y, false, isMoving);

          setAvatars((prev) =>
            applySelfMovementStep(
              prev,
              selfId,
              constrainedPos.x,
              constrainedPos.y,
              isMoving
            )
          );
        });
      } else {
        const currentAvatar = avatars.find((a) => a.id === selfId);
        if (currentAvatar && movementSystemRef.current) {
          movementSystemRef.current.updateCurrentPosition({
            x: currentAvatar.x,
            y: currentAvatar.y,
          });
        }
      }
    }
  }, [selfId, showWelcome]);

  return movementSystemRef;
}
