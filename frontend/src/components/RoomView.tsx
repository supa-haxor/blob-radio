import { useCallback, useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import RoomBackground from './RoomBackground';
import Profile from './Profile';
import MusicPlayer from './MusicPlayer';
import Chat from './Chat';
import AvatarsContainer from './AvatarsContainer';
import WelcomeModal from './WelcomeModal';
import ContextMenu, { type ContextMenuActionKey } from './ContextMenu';
import { useMySession } from '../store/MySessionStore';

export interface RoomViewProps {
  onRoomPointer: (e: MouseEvent | TouchEvent) => void;
  onModalComplete: (name: string, color: string, bg: string) => Promise<void>;
  onMenuAction: (action: ContextMenuActionKey) => void;
  onAvatarInteraction: (e: MouseEvent | TouchEvent, avatarId: string) => void;
  onAvatarMouseDown: (e: MouseEvent, avatarId: string) => void;
  onAvatarMouseUp: (e: MouseEvent, avatarId: string) => void;
}

export default function RoomView({
  onRoomPointer,
  onModalComplete,
  onMenuAction,
  onAvatarInteraction,
  onAvatarMouseDown,
  onAvatarMouseUp,
}: RoomViewProps) {
  const { background } = useMySession();
  const [showModal, setShowModal] = useState(false);

  const contextMenuLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const clearPendingContextMenuLongPress = useCallback(() => {
    if (contextMenuLongPressTimerRef.current !== null) {
      window.clearTimeout(contextMenuLongPressTimerRef.current);
      contextMenuLongPressTimerRef.current = null;
    }
  }, []);

  return (
    <div className="App">
      <div
        className="room"
        onClick={onRoomPointer}
        onTouchStart={onRoomPointer}
        onTouchEnd={clearPendingContextMenuLongPress}
        onTouchMove={clearPendingContextMenuLongPress}
      >
        <RoomBackground background={background} />
        <Profile onEdit={() => setShowModal(true)} />
        <div className="room-bottom">
          <AvatarsContainer
            contextMenuLongPressTimerRef={contextMenuLongPressTimerRef}
            onTouchMove={clearPendingContextMenuLongPress}
            onAvatarInteraction={onAvatarInteraction}
            onAvatarMouseDown={onAvatarMouseDown}
            onAvatarMouseUp={onAvatarMouseUp}
          />
          <Chat />
          <MusicPlayer />
        </div>
      </div>

      <ContextMenu onMenuAction={onMenuAction} />

      <WelcomeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onComplete={onModalComplete}
      />
    </div>
  );
}
