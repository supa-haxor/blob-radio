import { useCallback, useEffect, useMemo, useState } from 'react';
import './animations.css';
import './App.css';
import { emitChatMessage, emitProfileUpdate } from './socket';
import WelcomePage from './components/WelcomePage';
import RoomView from './components/RoomView';
import { AvatarActionsProvider, useAvatarActions } from './store/AvatarActionsStore';
import { AvatarsProvider, useAvatars } from './store/AvatarsStore';
import { AvatarSpeechProvider } from './store/AvatarSpeechStore';
import { MySessionProvider, useMySession } from './store/MySessionStore';
import { RoomUiProvider, useRoomUi } from './store/RoomUiStore';
import { ChatProvider } from './store/ChatStore';
import { MusicQueueProvider } from './store/MusicQueueStore';
import { mapSelfSqueeze } from './lib/avatars';
import {
  shouldShowWelcomeInitially,
  isReadyFromStoredWelcomeFlag,
  loadStoredProfile,
  persistProfile,
} from './lib/preferences';
import type { ContextMenuActionKey } from './components/ContextMenu';
import { useRoomMovement } from './hooks/useRoomMovement';
import { useRoomSocket } from './hooks/useRoomSocket';
import { useRoomInteractions } from './hooks/useRoomInteractions';
import { useClickOutsideMenu } from './hooks/useClickOutsideMenu';

function App() {
  return (
    <MySessionProvider>
      <AvatarsProvider>
        <AvatarSpeechProvider>
          <RoomUiProvider>
            <ChatProvider>
              <MusicQueueProvider>
                <AvatarActionsProvider>
                  <AppContent />
                </AvatarActionsProvider>
              </MusicQueueProvider>
            </ChatProvider>
          </RoomUiProvider>
        </AvatarSpeechProvider>
      </AvatarsProvider>
    </MySessionProvider>
  );
}

function AppContent() {
  const { selfId, userName, setUserName, setSelfColor, setBackground } = useMySession();
  const { avatars, setAvatars } = useAvatars();
  const { setMenuPosition, selectedAvatar } = useRoomUi();

  const [showWelcome, setShowWelcome] = useState(() => shouldShowWelcomeInitially());
  const [isReady, setIsReady] = useState(() => isReadyFromStoredWelcomeFlag());
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    triggerDance,
    triggerGreet,
    triggerJump,
    triggerMeditate,
    triggerSleep,
    clearAllSelfActions,
  } = useAvatarActions();

  const movementSystemRef = useRoomMovement(showWelcome);

  useRoomSocket(isReady, setShowWelcome, setIsConnecting, movementSystemRef);

  useClickOutsideMenu();

  const applySelfSqueeze = useCallback(
    (squeezed: boolean) => {
      setAvatars((prev) => mapSelfSqueeze(prev, selfId, squeezed));
    },
    [selfId, setAvatars]
  );

  const {
    handleRoomInteraction,
    handleAvatarInteraction,
    handleAvatarMouseDown,
    handleAvatarMouseUp,
  } = useRoomInteractions({
    movementSystemRef,
    applySelfSqueeze,
    clearAllSelfActions,
  });

  useEffect(() => {
    const profile = loadStoredProfile();
    if (profile) {
      setUserName(profile.name);
      setSelfColor(profile.color);
      setShowWelcome(false);
      setIsReady(true);
    }
  }, [setUserName, setSelfColor]);

  const handleWelcomeComplete = (name: string, color: string, bg: string) => {
    setUserName(name);
    setSelfColor(color);
    setBackground(bg);
    setIsConnecting(true);
    setIsReady(true);
  };

  const handleModalComplete = async (name: string, color: string, bg: string) => {
    persistProfile(name, color, bg);
    setUserName(name);
    setSelfColor(color);
    setBackground(bg);
    emitProfileUpdate(name, color);
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  const menuActionHandlers = useMemo(
    () =>
      ({
        Dance: triggerDance,
        Greet: triggerGreet,
        Jump: triggerJump,
        Meditate: triggerMeditate,
        Sleep: triggerSleep,
      }) as const,
    [triggerDance, triggerGreet, triggerJump, triggerMeditate, triggerSleep]
  );

  const handleMenuAction = (action: ContextMenuActionKey) => {
    if (!selectedAvatar || selectedAvatar !== selfId) return;
    menuActionHandlers[action]();
    setMenuPosition(null);
  };

  const handleGreetOtherUser = useCallback(
    (targetAvatarId: string) => {
      if (!selfId || targetAvatarId === selfId) return;
      triggerGreet();
      const fromName =
        avatars.find((a) => a.id === selfId)?.name?.trim() ||
        userName?.trim() ||
        'Anonymous';
      const toName =
        avatars.find((a) => a.id === targetAvatarId)?.name?.trim() || 'Anonymous';
      emitChatMessage({
        id: `${Date.now()}-${selfId}-greet-${targetAvatarId}`,
        text: '',
        sender: '',
        timestamp: new Date(),
        senderColor: '#D2691E',
        messageType: 'directedGreet',
        greetFromId: selfId,
        greetToId: targetAvatarId,
        greetFromName: fromName,
        greetToName: toName,
        broadcast: true,
      });
      setMenuPosition(null);
    },
    [selfId, triggerGreet, avatars, userName, setMenuPosition]
  );

  if (showWelcome) {
    return <WelcomePage onComplete={handleWelcomeComplete} isConnecting={isConnecting} />;
  }

  return (
    <RoomView
      onRoomPointer={handleRoomInteraction}
      onModalComplete={handleModalComplete}
      onMenuAction={handleMenuAction}
      onGreetOtherUser={handleGreetOtherUser}
      onAvatarInteraction={handleAvatarInteraction}
      onAvatarMouseDown={handleAvatarMouseDown}
      onAvatarMouseUp={handleAvatarMouseUp}
    />
  );
}

export default App;
