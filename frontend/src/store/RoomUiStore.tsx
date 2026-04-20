import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

/** Room-level UI: context menu anchor + which avatar id the menu is for (not "my profile"). */
export interface RoomUiState {
  menuPosition: { x: number; y: number } | null;
  setMenuPosition: Dispatch<SetStateAction<{ x: number; y: number } | null>>;
  selectedAvatar: string | null;
  setSelectedAvatar: Dispatch<SetStateAction<string | null>>;
}

const RoomUiContext = createContext<RoomUiState | null>(null);

export function RoomUiProvider({ children }: { children: React.ReactNode }) {
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      menuPosition,
      setMenuPosition,
      selectedAvatar,
      setSelectedAvatar,
    }),
    [menuPosition, selectedAvatar]
  );

  return (
    <RoomUiContext.Provider value={value}>{children}</RoomUiContext.Provider>
  );
}

export function useRoomUi(): RoomUiState {
  const ctx = useContext(RoomUiContext);
  if (!ctx) {
    throw new Error('useRoomUi must be used within a RoomUiProvider');
  }
  return ctx;
}
