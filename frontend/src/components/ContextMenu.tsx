import { CONTEXT_MENU_ITEMS } from '../lib/actions';
import { useAvatars } from '../store/AvatarsStore';
import { useMySession } from '../store/MySessionStore';
import { useRoomUi } from '../store/RoomUiStore';

export type ContextMenuActionKey = (typeof CONTEXT_MENU_ITEMS)[number]['action'];

export interface ContextMenuProps {
  onMenuAction: (action: ContextMenuActionKey) => void;
}

export default function ContextMenu({ onMenuAction }: ContextMenuProps) {
  const { avatars } = useAvatars();
  const { selfId } = useMySession();
  const { menuPosition, selectedAvatar } = useRoomUi();

  if (!menuPosition || !selectedAvatar) {
    return null;
  }

  return (
    <div
      className="context-menu"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
    >
      {selectedAvatar === selfId ? (
        <>
          {CONTEXT_MENU_ITEMS.map(({ action, label }) => (
            <button
              key={action}
              type="button"
              onClick={() => onMenuAction(action)}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onMenuAction(action);
              }}
            >
              {label}
            </button>
          ))}
        </>
      ) : (
        <div className="avatar-id">
          {avatars.find((a) => a.id === selectedAvatar)?.name || 'Anonymous'}
        </div>
      )}
    </div>
  );
}
