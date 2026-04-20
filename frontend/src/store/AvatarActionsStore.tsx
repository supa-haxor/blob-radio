import React, { createContext, useContext, useCallback } from 'react';
import { emitAvatarDance, emitAvatarGreet, emitAvatarJump, emitAvatarMeditate } from '../socket';
import { useAvatars } from './AvatarsStore';
import { useMySession } from './MySessionStore';

interface AvatarActionsContextType {
  triggerDance: () => void;
  triggerGreet: () => void;
  triggerJump: () => void;
  triggerMeditate: () => void;
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
        ? { ...avatar, isDancing, isMeditating: false }
        : avatar
    ));
    emitAvatarDance(isDancing);
  }, [avatars, selfId, setAvatars]);

  const triggerGreet = useCallback(() => {
    if (!selfId) return;
    
    setAvatars(prev => prev.map(avatar => 
      avatar.id === selfId 
        ? { ...avatar, isGreeting: true }
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
        ? { ...avatar, isJumping: true }
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
        ? { ...avatar, isMeditating, isDancing: false }
        : avatar
    ));
    emitAvatarMeditate(isMeditating);
  }, [avatars, selfId, setAvatars]);

  const value = {
    triggerDance,
    triggerGreet,
    triggerJump,
    triggerMeditate
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