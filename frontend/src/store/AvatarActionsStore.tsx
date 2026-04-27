import React, { createContext, useContext, useCallback } from 'react';
import { emitAvatarDance, emitAvatarDie, emitAvatarGreet, emitAvatarJump, emitAvatarMeditate, emitAvatarSleep } from '../socket';
import { useAvatars } from './AvatarsStore';
import { useMySession } from './MySessionStore';

interface AvatarActionsContextType {
  triggerDance: () => void;
  triggerGreet: () => void;
  triggerJump: () => void;
  triggerMeditate: () => void;
  triggerSleep: () => void;
  /** Chat-only `/die` — not exposed on the context menu. */
  triggerDie: () => void;
  /** Mouse click on own avatar — clears emotes / die and syncs server. */
  clearAllSelfActions: () => void;
}

const AvatarActionsContext = createContext<AvatarActionsContextType | null>(null);

interface AvatarActionsProviderProps {
  children: React.ReactNode;
}

export const AvatarActionsProvider: React.FC<AvatarActionsProviderProps> = ({
  children,
}) => {
  const { selfId } = useMySession();
  const { avatars, setAvatars } = useAvatars();
  const triggerDance = useCallback(() => {
    if (!selfId) return;
    
    const isDancing = !avatars.find(a => a.id === selfId)?.isDancing;
    setAvatars(prev => prev.map(avatar => 
      avatar.id === selfId 
        ? {
            ...avatar,
            isDancing,
            isMeditating: false,
            isSleeping: false,
            ...(isDancing ? { isDead: false } : {}),
          }
        : avatar
    ));
    emitAvatarDance(isDancing);
  }, [avatars, selfId, setAvatars]);

  const triggerGreet = useCallback(() => {
    if (!selfId) return;
    
    setAvatars(prev => prev.map(avatar => 
      avatar.id === selfId 
        ? { ...avatar, isGreeting: true, isMeditating: false, isSleeping: false, isDead: false }
        : avatar
    ));
    
    emitAvatarGreet(true);
    
    setTimeout(() => {
      setAvatars(prev => prev.map(avatar => 
        avatar.id === selfId 
          ? { ...avatar, isGreeting: false }
          : avatar
      ));
      emitAvatarGreet(false);
    }, 600);
  }, [selfId, setAvatars]);

  const triggerJump = useCallback(() => {
    if (!selfId) return;
    
    setAvatars(prev => prev.map(avatar => 
      avatar.id === selfId 
        ? { ...avatar, isJumping: true, isMeditating: false, isSleeping: false, isDead: false }
        : avatar
    ));
    
    emitAvatarJump(true);
    
    setTimeout(() => {
      setAvatars(prev => prev.map(avatar => 
        avatar.id === selfId 
          ? { ...avatar, isJumping: false }
          : avatar
      ));
      emitAvatarJump(false);
    }, 1500);
  }, [selfId, setAvatars]);

  const triggerMeditate = useCallback(() => {
    if (!selfId) return;
    
    const isMeditating = !avatars.find(a => a.id === selfId)?.isMeditating;
    setAvatars(prev => prev.map(avatar => 
      avatar.id === selfId 
        ? {
            ...avatar,
            isMeditating,
            isDancing: false,
            isSleeping: false,
            ...(isMeditating ? { isDead: false } : {}),
          }
        : avatar
    ));
    emitAvatarMeditate(isMeditating);
  }, [avatars, selfId, setAvatars]);

  const triggerSleep = useCallback(() => {
    if (!selfId) return;

    const isSleeping = !avatars.find(a => a.id === selfId)?.isSleeping;
    setAvatars(prev => prev.map(avatar =>
      avatar.id === selfId
        ? {
            ...avatar,
            isSleeping,
            isDancing: false,
            isMeditating: false,
            ...(isSleeping ? { isDead: false } : {}),
          }
        : avatar
    ));
    emitAvatarSleep(isSleeping);
  }, [avatars, selfId, setAvatars]);

  const triggerDie = useCallback(() => {
    if (!selfId) return;

    const isDead = !avatars.find((a) => a.id === selfId)?.isDead;
    setAvatars((prev) =>
      prev.map((avatar) =>
        avatar.id === selfId
          ? { ...avatar, isDead, isDancing: false, isMeditating: false, isSleeping: false }
          : avatar
      )
    );
    emitAvatarDie(isDead);
  }, [avatars, selfId, setAvatars]);

  const clearAllSelfActions = useCallback(() => {
    if (!selfId) return;
    const me = avatars.find((a) => a.id === selfId);
    if (!me) return;
    if (
      !me.isDancing &&
      !me.isGreeting &&
      !me.isJumping &&
      !me.isMeditating &&
      !me.isSleeping &&
      !me.isDead
    ) {
      return;
    }

    setAvatars((prev) =>
      prev.map((avatar) =>
        avatar.id === selfId
          ? {
              ...avatar,
              isDancing: false,
              isGreeting: false,
              isJumping: false,
              isMeditating: false,
              isSleeping: false,
              isDead: false,
            }
          : avatar
      )
    );

    if (me.isDancing) emitAvatarDance(false);
    if (me.isGreeting) emitAvatarGreet(false);
    if (me.isJumping) emitAvatarJump(false);
    if (me.isMeditating) emitAvatarMeditate(false);
    if (me.isSleeping) emitAvatarSleep(false);
    if (me.isDead) emitAvatarDie(false);
  }, [avatars, selfId, setAvatars]);

  const value = {
    triggerDance,
    triggerGreet,
    triggerJump,
    triggerMeditate,
    triggerSleep,
    triggerDie,
    clearAllSelfActions,
  };

  return (
    <AvatarActionsContext.Provider value={value}>
      {children}
    </AvatarActionsContext.Provider>
  );
};

export const useAvatarActions = (): AvatarActionsContextType => {
  const context = useContext(AvatarActionsContext);
  if (!context) {
    throw new Error('useAvatarActions must be used within an AvatarActionsProvider');
  }
  return context;
}; 