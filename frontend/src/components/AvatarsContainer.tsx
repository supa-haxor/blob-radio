import type { ComponentProps, MouseEvent, MutableRefObject, TouchEvent } from 'react';
import { useMemo } from 'react';
import Avatar from './Avatar';
import { computeAvatarStackZIndices } from '../lib/avatars';
import { useSmoothedYForDepthOrder } from '../hooks/useSmoothedYForDepthOrder';
import { useAvatars } from '../store/AvatarsStore';
import { useAvatarSpeechLine } from '../store/AvatarSpeechStore';
import { useMySession } from '../store/MySessionStore';
import { useRoomUi } from '../store/RoomUiStore';

function AvatarWithSpeech(props: ComponentProps<typeof Avatar>) {
  const speechText = useAvatarSpeechLine(props.id);
  return <Avatar {...props} speechText={speechText} />;
}

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
  const { avatars, stableAvatars } = useAvatars();
  const { selfId } = useMySession();
  const { menuPosition, setMenuPosition, setSelectedAvatar } = useRoomUi();

  const depthNodes = useMemo(
    () => avatars.map((a) => ({ id: a.id, y: a.y })),
    [avatars]
  );
  const smoothedYById = useSmoothedYForDepthOrder(depthNodes);

  const stackZById = useMemo(() => {
    const forStack = avatars.map((a) => ({
      ...a,
      y: smoothedYById[a.id] ?? a.y,
    }));
    return computeAvatarStackZIndices(forStack);
  }, [avatars, smoothedYById]);

  return (
    <div className="avatars-container">
      {stableAvatars.map((avatar) => (
        <AvatarWithSpeech
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
          isSleeping={avatar.isSleeping}
          isDead={avatar.isDead}
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
          stackZIndex={stackZById[avatar.id]}
        />
      ))}
    </div>
  );
}
