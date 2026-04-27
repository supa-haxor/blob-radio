import React, { type MutableRefObject, useEffect, useRef, useState } from 'react';
import { timeToHoldToOpenContextMenuMs } from '../config/roomUi';
import { clampFixedContextMenuPosition } from '../lib/contextMenuViewport';
import { avatarStackZIndex } from '../lib/avatars';
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
  isSleeping?: boolean;
  isDead?: boolean;
  isSqueezed?: boolean;
  /** Transient line shown above the avatar (from `avatar:speech` / typed chat). */
  speechText?: string;
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
  /** From full-room rank; when set, z only shifts when depth order vs others changes. */
  stackZIndex?: number;
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
  isSleeping = false,
  isDead = false,
  isSqueezed = false,
  speechText,
  isSelf = false,
  menuPosition = null,
  contextMenuLongPressTimerRef,
  selfId = '',
  onAvatarInteraction,
  onMouseDown,
  onMouseUp,
  onTouchMove,
  setMenuPosition,
  setSelectedAvatar,
  stackZIndex
}) => {
  const { setAvatars } = useAvatars();

  const speechMountedRef = useRef(false);
  const [speechLine, setSpeechLine] = useState<string | undefined>(undefined);
  const [speechEntering, setSpeechEntering] = useState(false);
  const [speechLeaving, setSpeechLeaving] = useState(false);

  useEffect(() => {
    if (speechText) {
      const firstIn = !speechMountedRef.current;
      speechMountedRef.current = true;
      setSpeechLine(speechText);
      setSpeechLeaving(false);
      if (firstIn) {
        setSpeechEntering(true);
        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => setSpeechEntering(false));
        });
        return () => {
          cancelAnimationFrame(raf1);
          if (raf2) cancelAnimationFrame(raf2);
        };
      }
      return;
    }
    if (!speechMountedRef.current) return;
    setSpeechLeaving(true);
    const t = window.setTimeout(() => {
      speechMountedRef.current = false;
      setSpeechLine(undefined);
      setSpeechLeaving(false);
    }, 280);
    return () => window.clearTimeout(t);
  }, [speechText]);
  const handleClick = (e: React.MouseEvent) => {
    if (menuPosition && setMenuPosition) {
      setMenuPosition(null);
      if (!isSelf) return;
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
    isSleeping ? 'sleeping' : '',
    isDead ? 'dead' : '',
    isSqueezed ? 'squeezed' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className="avatar-container"
      style={{
        transform: `translate(${x}px, ${y}px)`,
        zIndex: stackZIndex ?? avatarStackZIndex(y, id)
      }}
    >
      {/* Avatar name - positioned outside animated body */}
      <div className="avatar-name-stable">
        {name}
      </div>

      {/* Avatar body - animated (dance/jump); speech stays a sibling so it does not inherit motion */}
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
        {isDead ? <span className="avatar-dead-tongue" aria-hidden /> : null}
        {isSleeping ? (
          <span className="avatar-sleep-zzz" aria-hidden>
            <span className="avatar-sleep-z avatar-sleep-z--1">z</span>
            <span className="avatar-sleep-z avatar-sleep-z--2">z</span>
            <span className="avatar-sleep-z avatar-sleep-z--3">z</span>
          </span>
        ) : null}
      </div>

      {isDead ? (
        <div className="avatar-dead-angel" aria-hidden>
          <div className="avatar-dead-angel-bob">
            <div className="avatar-dead-angel-halo" />
            <div className="avatar-dead-angel-flap">
              <span className="avatar-dead-angel-wing avatar-dead-angel-wing--l" />
              <div className="avatar-dead-angel-body">
                <div className="avatar-dead-angel-face">
                  <div className="avatar-dead-angel-face-mouth" aria-hidden />
                  <div className="eyes" />
                </div>
              </div>
              <span className="avatar-dead-angel-wing avatar-dead-angel-wing--r" />
            </div>
          </div>
        </div>
      ) : null}

      {speechLine ? (
        <div
          className={[
            'avatar-speech-bubble',
            speechEntering ? 'is-bubble-enter' : '',
            speechLeaving ? 'is-bubble-leave' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="status"
        >
          {speechLine}
        </div>
      ) : null}
    </div>
  );
};

export default Avatar; 