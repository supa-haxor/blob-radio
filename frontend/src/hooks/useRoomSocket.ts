import { useEffect, type RefObject } from 'react';
import { MovementSystem } from '../movement';
import {
  initSocket,
  onAvatarsUpdate,
  onAvatarDisconnect,
  emitAvatarPosition,
} from '../socket';
import type { Avatar as ClientAvatar } from '../types/avatar';
import { useAvatars } from '../store/AvatarsStore';
import { useMySession } from '../store/MySessionStore';
import { getRandomPosition } from '../lib/room';
import { mergeServerAvatarBroadcast, appendAvatarIfNew } from '../lib/avatars';

export function useRoomSocket(
  isReady: boolean,
  setShowWelcome: (v: boolean) => void,
  setIsConnecting: (v: boolean) => void,
  movementSystemRef: RefObject<MovementSystem | null>
) {
  const { userName, selfColor, selfId, setSelfId } = useMySession();
  const { avatars, setAvatars } = useAvatars();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const socket = initSocket();

    const onSocketReady = () => {
      if (!socket.id) return;
      setSelfId(socket.id);

      if (!userName || !selfColor) return;

      const socketId = socket.id;
      const initialPos = getRandomPosition();

      setAvatars((prev) => {
        const newAvatar: ClientAvatar = {
          id: socketId,
          x: initialPos.x,
          y: initialPos.y,
          color: selfColor,
          name: userName,
          isWalking: false,
        };

        const next = appendAvatarIfNew(prev, newAvatar);
        if (next === prev) return prev;

        emitAvatarPosition(
          initialPos.x,
          initialPos.y,
          false,
          false,
          userName,
          selfColor
        );
        setShowWelcome(false);
        setIsConnecting(false);

        return next;
      });
    };

    if (socket.connected) {
      onSocketReady();
    }

    socket.on('connect', onSocketReady);

    socket.on('connect_error', () => {
      setIsConnecting(false);
    });

    const t = window.setTimeout(() => {
      if (!socket.connected) {
        setIsConnecting(false);
      }
    }, 5000);

    onAvatarsUpdate((newAvatars) => {
      const isMoving = movementSystemRef.current?.isMoving ?? false;
      setAvatars(
        mergeServerAvatarBroadcast(newAvatars, avatars, selfId, isMoving)
      );
    });

    onAvatarDisconnect((id) => {
      setAvatars((prev) => prev.filter((avatar) => avatar.id !== id));
    });

    return () => {
      window.clearTimeout(t);
      socket.off('connect', onSocketReady);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- single subscription; deps match legacy App
  }, [isReady]);
}
