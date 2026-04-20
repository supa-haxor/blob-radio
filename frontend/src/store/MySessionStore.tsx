import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { getStoredBackground, persistBackground } from '../lib/preferences';

export interface MySessionState {
  userName: string;
  setUserName: Dispatch<SetStateAction<string>>;
  selfColor: string;
  setSelfColor: Dispatch<SetStateAction<string>>;
  background: string;
  setBackground: Dispatch<SetStateAction<string>>;
  /** Persist background choice (localStorage + state). */
  setBackgroundPersisted: (bg: string) => void;
  selfId: string;
  setSelfId: Dispatch<SetStateAction<string>>;
}

const MySessionContext = createContext<MySessionState | null>(null);

export function MySessionProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState('');
  const [selfColor, setSelfColor] = useState('');
  const [background, setBackground] = useState(() => getStoredBackground());
  const [selfId, setSelfId] = useState('');

  const setBackgroundPersisted = useCallback((bg: string) => {
    setBackground(bg);
    persistBackground(bg);
  }, []);

  const value = useMemo(
    () => ({
      userName,
      setUserName,
      selfColor,
      setSelfColor,
      background,
      setBackground,
      setBackgroundPersisted,
      selfId,
      setSelfId,
    }),
    [userName, selfColor, background, selfId, setBackgroundPersisted]
  );

  return (
    <MySessionContext.Provider value={value}>
      {children}
    </MySessionContext.Provider>
  );
}

export function useMySession(): MySessionState {
  const ctx = useContext(MySessionContext);
  if (!ctx) {
    throw new Error('useMySession must be used within a MySessionProvider');
  }
  return ctx;
}
