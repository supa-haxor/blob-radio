import { CONTEXT_MENU_ITEMS } from '../lib/actions';
import { useAvatars } from '../store/AvatarsStore';
import { useMySession } from '../store/MySessionStore';
import { useRoomUi } from '../store/RoomUiStore';

export type ContextMenuActionKey = (typeof CONTEXT_MENU_ITEMS)[number]['action'];

export interface ContextMenuProps {
  onMenuAction: (action: ContextMenuActionKey) => void;
  onGreetOtherUser: (targetAvatarId: string) => void;
}

export default function ContextMenu({ onMenuAction, onGreetOtherUser }: ContextMenuProps) {
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
        <button
          type="button"
          className="context-menu-greet-other"
          onClick={() => onGreetOtherUser(selectedAvatar)}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onGreetOtherUser(selectedAvatar);
          }}
        >
          Greet
        </button>
      )}
    </div>
  );
}
