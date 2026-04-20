import { useCallback, useEffect } from 'react';
import { useRoomUi } from '../store/RoomUiStore';

export function useClickOutsideMenu() {
  const { menuPosition, setMenuPosition } = useRoomUi();

  const handleClickOutside = useCallback(() => {
    if (menuPosition) {
      setMenuPosition(null);
    }
  }, [menuPosition, setMenuPosition]);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);
}
