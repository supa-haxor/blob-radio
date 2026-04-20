import React, { type MutableRefObject } from 'react';
import { timeToHoldToOpenContextMenuMs } from '../config/roomUi';
import { clampFixedContextMenuPosition } from '../lib/contextMenuViewport';
import { useAvatars } from '../store/AvatarsStore';

interface AvatarProps {
  id: string;
  x: number;
  y: number;
  color: string;
  name?: string;
  isWalking?: boolean;
  isDancing?: boolean;
  isGreeting?: boolean;
  isJumping?: boolean;
  isMeditating?: boolean;
  isSqueezed?: boolean;
  isSelf?: boolean;
  menuPosition?: { x: number; y: number } | null;
  /** When omitted (e.g. legacy demos), touch long-press context menu is disabled. */
  contextMenuLongPressTimerRef?: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  selfId?: string;
  onAvatarInteraction?: (e: React.MouseEvent | React.TouchEvent, avatarId: string) => void;
  onMouseDown?: (e: React.MouseEvent, avatarId: string) => void;
  onMouseUp?: (e: React.MouseEvent, avatarId: string) => void;
  onTouchMove?: () => void;
  setMenuPosition?: (position: { x: number; y: number } | null) => void;
  setSelectedAvatar?: (id: string | null) => void;
}

const Avatar: React.FC<AvatarProps> = ({
  id,
  x,
  y,
  color,
  name = 'Anonymous',
  isWalking = false,
  isDancing = false,
  isGreeting = false,
  isJumping = false,
  isMeditating = false,
  isSqueezed = false,
  isSelf = false,
  menuPosition = null,
  contextMenuLongPressTimerRef,
  selfId = '',
  onAvatarInteraction,
  onMouseDown,
  onMouseUp,
  onTouchMove,
  setMenuPosition,
  setSelectedAvatar
}) => {
  const { setAvatars } = useAvatars();
  const handleClick = (e: React.MouseEvent) => {
    if (menuPosition && setMenuPosition) {
      setMenuPosition(null);
      return;
    }
    if (onAvatarInteraction) {
      onAvatarInteraction(e, id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!setMenuPosition || !setSelectedAvatar) return;
    
    const { x, y } = clampFixedContextMenuPosition(
      e.clientX,
      e.clientY,
      id === selfId ? 'self' : 'otherUser'
    );
    setMenuPosition({ x, y });
    setSelectedAvatar(id);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (id === selfId) {
      if (onAvatarInteraction) onAvatarInteraction(e, id);
      return;
    }

    if (!setMenuPosition || !setSelectedAvatar || !contextMenuLongPressTimerRef) return;

    if (contextMenuLongPressTimerRef.current !== null) {
      clearTimeout(contextMenuLongPressTimerRef.current);
      contextMenuLongPressTimerRef.current = null;
    }

    const touch = e.touches[0];
    if (!touch) return;
    const startX = touch.clientX;
    const startY = touch.clientY;

    contextMenuLongPressTimerRef.current = window.setTimeout(() => {
      contextMenuLongPressTimerRef.current = null;
      const { x, y } = clampFixedContextMenuPosition(startX, startY, 'otherUser');
      setMenuPosition({ x, y });
      setSelectedAvatar(id);
    }, timeToHoldToOpenContextMenuMs);
  };

  const handleTouchEnd = (_e: React.TouchEvent) => {
    if (id === selfId) {
      setAvatars(prev => prev.map(a => 
        a.id === selfId 
          ? { ...a, isSqueezed: false }
          : a
      ));
    }
    const ref = contextMenuLongPressTimerRef;
    if (ref?.current != null) {
      clearTimeout(ref.current);
      ref.current = null;
    }
  };

  // Build classes for the main avatar container (to match original CSS)
  const avatarClasses = [
    'avatar',
    isSelf ? 'self' : '',
    isWalking ? 'walking' : '',
    isDancing ? 'dancing' : '',
    isGreeting ? 'greeting' : '',
    isJumping ? 'jumping' : '',
    isMeditating ? 'meditating' : '',
    isSqueezed ? 'squeezed' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className="avatar-container"
      style={{
        transform: `translate(${x}px, ${y}px)`,
        zIndex: Math.floor(y)
      }}
    >
      {/* Avatar name - positioned outside animated body */}
      <div className="avatar-name-stable">
        {name}
      </div>
      
      {/* Avatar body - this is the animated part */}
      <div
        className={avatarClasses}
        style={{
          backgroundColor: color
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => onMouseDown && onMouseDown(e, id)}
        onMouseUp={(e) => onMouseUp && onMouseUp(e, id)}
        onTouchMove={onTouchMove}
      >
        <div className="eyes" />
      </div>
    </div>
  );
};

export default Avatar; 