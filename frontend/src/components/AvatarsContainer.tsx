import type { MouseEvent, MutableRefObject, TouchEvent } from 'react';
import Avatar from './Avatar';
import { useAvatars } from '../store/AvatarsStore';
import { useMySession } from '../store/MySessionStore';
import { useRoomUi } from '../store/RoomUiStore';

export interface AvatarsContainerProps {
  contextMenuLongPressTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  onTouchMove: () => void;
  onAvatarInteraction: (e: MouseEvent | TouchEvent, avatarId: string) => void;
  onAvatarMouseDown: (e: MouseEvent, avatarId: string) => void;
  onAvatarMouseUp: (e: MouseEvent, avatarId: string) => void;
}

export default function AvatarsContainer({
  contextMenuLongPressTimerRef,
  onTouchMove,
  onAvatarInteraction,
  onAvatarMouseDown,
  onAvatarMouseUp,
}: AvatarsContainerProps) {
  const { sortedAvatars } = useAvatars();
  const { selfId } = useMySession();
  const { menuPosition, setMenuPosition, setSelectedAvatar } = useRoomUi();

  return (
    <div className="avatars-container">
      {sortedAvatars.map((avatar) => (
        <Avatar
          key={avatar.id}
          id={avatar.id}
          x={avatar.x}
          y={avatar.y}
          color={avatar.color}
          name={avatar.name}
          isWalking={avatar.isWalking}
          isDancing={avatar.isDancing}
          isGreeting={avatar.isGreeting}
          isJumping={avatar.isJumping}
          isMeditating={avatar.isMeditating}
          isSqueezed={avatar.isSqueezed}
          isSelf={avatar.id === selfId}
          menuPosition={menuPosition}
          contextMenuLongPressTimerRef={contextMenuLongPressTimerRef}
          selfId={selfId}
          onAvatarInteraction={onAvatarInteraction}
          onMouseDown={onAvatarMouseDown}
          onMouseUp={onAvatarMouseUp}
          onTouchMove={onTouchMove}
          setMenuPosition={setMenuPosition}
          setSelectedAvatar={setSelectedAvatar}
        />
      ))}
    </div>
  );
}
