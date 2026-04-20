import { useCallback, type RefObject } from 'react';
import type { MouseEvent, TouchEvent } from 'react';
import { useAvatars } from '../store/AvatarsStore';
import { useChat } from '../store/ChatStore';
import { useMySession } from '../store/MySessionStore';
import { useRoomUi } from '../store/RoomUiStore';
import { constrainToFloor } from '../lib/room';
import { clampFixedContextMenuPosition } from '../lib/contextMenuViewport';
import { getPointRelativeToRoomBottom, isClientPointInsideContextMenu } from '../lib/roomDom';
import { getClientPointFromEvent } from '../lib/pointer';
import { setSelfWalkingTrue } from '../lib/avatars';
import type { MovementSystem } from '../movement';

export function useRoomInteractions({
  movementSystemRef,
  applySelfSqueeze,
}: {
  movementSystemRef: RefObject<MovementSystem | null>;
  applySelfSqueeze: (squeezed: boolean) => void;
}) {
  const { isChatOpen } = useChat();
  const { selfId } = useMySession();
  const { setMenuPosition, setSelectedAvatar } = useRoomUi();
  const { avatars, setAvatars } = useAvatars();
  const handleRoomInteraction = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (isChatOpen) {
        return;
      }

      const { clientX, clientY } = getClientPointFromEvent(e);
      if (isClientPointInsideContextMenu(clientX, clientY)) {
        return;
      }

      const clickedElement = e.target as HTMLElement;
      if (clickedElement.closest('.avatar')) {
        return;
      }

      const rel = getPointRelativeToRoomBottom(clientX, clientY);
      if (!rel) return;

      const constrainedPos = constrainToFloor(rel.x, rel.y);

      if (movementSystemRef.current) {
        const currentAvatar = avatars.find((a) => a.id === selfId);
        if (!currentAvatar) return;

        movementSystemRef.current.updateCurrentPosition({
          x: currentAvatar.x,
          y: currentAvatar.y,
        });

        setAvatars((prev) => setSelfWalkingTrue(prev, selfId));
        movementSystemRef.current.setTarget(constrainedPos);
      }
    },
    [
      isChatOpen,
      selfId,
      avatars,
      setAvatars,
      movementSystemRef,
    ]
  );

  const handleAvatarInteraction = useCallback(
    (e: MouseEvent | TouchEvent, avatarId: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (avatarId === selfId) {
        if ('touches' in e) {
          applySelfSqueeze(true);
        }
        return;
      }

      if (e.type === 'contextmenu') {
        const me = e as MouseEvent;
        const { x, y } = clampFixedContextMenuPosition(
          me.clientX,
          me.clientY,
          'otherUser'
        );
        setMenuPosition({ x, y });
        setSelectedAvatar(avatarId);
        return;
      }
    },
    [selfId, applySelfSqueeze, setMenuPosition, setSelectedAvatar]
  );

  const handleAvatarMouseDown = useCallback(
    (_e: MouseEvent, avatarId: string) => {
      if (avatarId === selfId) {
        applySelfSqueeze(true);
      }
    },
    [selfId, applySelfSqueeze]
  );

  const handleAvatarMouseUp = useCallback(
    (_e: MouseEvent, avatarId: string) => {
      if (avatarId === selfId) {
        applySelfSqueeze(false);
      }
    },
    [selfId, applySelfSqueeze]
  );

  return {
    handleRoomInteraction,
    handleAvatarInteraction,
    handleAvatarMouseDown,
    handleAvatarMouseUp,
  };
}
