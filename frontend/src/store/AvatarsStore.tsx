import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { Avatar } from '../types/avatar';
import { sortAvatarsStableById } from '../lib/avatars';

interface AvatarsContextValue {
  avatars: Avatar[];
  setAvatars: Dispatch<SetStateAction<Avatar[]>>;
  /** Same avatars as `avatars`, sorted by id so DOM order stays stable; depth uses z-index only. */
  stableAvatars: Avatar[];
}

const AvatarsContext = createContext<AvatarsContextValue | null>(null);

export function AvatarsProvider({ children }: { children: React.ReactNode }) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);

  const stableAvatars = useMemo(() => sortAvatarsStableById(avatars), [avatars]);

  const value = useMemo(
    () => ({ avatars, setAvatars, stableAvatars }),
    [avatars, stableAvatars]
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
