import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { Avatar } from '../types/avatar';
import { sortAvatarsByDepth } from '../lib/avatars';

interface AvatarsContextValue {
  avatars: Avatar[];
  setAvatars: Dispatch<SetStateAction<Avatar[]>>;
  /** Depth order for rendering (derived from `avatars`). */
  sortedAvatars: Avatar[];
}

const AvatarsContext = createContext<AvatarsContextValue | null>(null);

export function AvatarsProvider({ children }: { children: React.ReactNode }) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);

  const sortedAvatars = useMemo(
    () => sortAvatarsByDepth(avatars),
    [avatars]
  );

  const value = useMemo(
    () => ({ avatars, setAvatars, sortedAvatars }),
    [avatars, sortedAvatars]
  );

  return (
    <AvatarsContext.Provider value={value}>{children}</AvatarsContext.Provider>
  );
}

export function useAvatars(): AvatarsContextValue {
  const ctx = useContext(AvatarsContext);
  if (!ctx) {
    throw new Error('useAvatars must be used within an AvatarsProvider');
  }
  return ctx;
}
