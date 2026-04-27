import { io, Socket } from 'socket.io-client';
import type { Avatar } from './types/avatar';

interface ServerAvatar {
  id: string;
  position: {
    x: number;
    y: number;
  };
  color: string;
  isDancing?: boolean;
  isGreeting?: boolean;
  isJumping?: boolean;
  isMeditating?: boolean;
  isSleeping?: boolean;
  isDead?: boolean;
  isWalking?: boolean;
  name?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  senderColor: string;
  messageType?:
    | 'normal'
    | 'system'
    | 'notification'
    | 'quiet'
    | 'action'
    | 'directedGreet'
    | 'greetEveryone';
  broadcast?: boolean; // true = send to all users, false = local only
  /** directedGreet / greetEveryone — from socket id + display name */
  greetFromId?: string;
  greetToId?: string;
  greetFromName?: string;
  greetToName?: string;
  videoUrl?: string;
}

// Music interfaces
export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  url: string;
  addedBy?: string;
  duration: string;
  durationSeconds: number;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt?: string;
  viewCount?: number;
}

export interface MusicState {
  currentSong: QueueItem | null;
  queue: QueueItem[];
  history: QueueItem[];
  currentTime: number;
  isPlaying: boolean;
  lastUpdateTime: number;
}

// Store colors for each avatar ID
const avatarColors = new Map<string, string>();

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_RETRIES = 5;

export const initSocket = () => {
  if (!socket) {
    // Dev: backend on :3001. Prod (nginx/Caddy same host): WebSocket proxied on 443 — use same origin.
    const explicit = import.meta.env.VITE_SOCKET_URL as string | undefined;
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const socketUrl =
      explicit?.trim() ||
      (import.meta.env.PROD
        ? window.location.origin
        : `${protocol}//${hostname}:3001`);

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RETRIES,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: false // We'll handle connection manually
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.log('Connection error:', error.message);
      connectionAttempts++;
      if (connectionAttempts < MAX_RETRIES) {
        setTimeout(() => {
          console.log(`Retrying connection (attempt ${connectionAttempts + 1}/${MAX_RETRIES})...`);
          socket?.connect();
        }, 1000);
      }
    });

    // Handle successful connection
    socket.on('connect', () => {
      console.log('Successfully connected to server');
      connectionAttempts = 0;
    });

    // Start the connection
    console.log('Attempting to connect to server...');
    socket.connect();
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    socket = initSocket();
  }
  return socket;
};

export const emitAvatarPosition = (x: number, y: number, isDancing: boolean = false, isWalking: boolean = false, name?: string, color?: string) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('avatar:position', { 
      position: { x, y }, 
      isDancing, 
      isWalking,
      name,
      color
    });
  } else {
    console.log('Socket not connected, position update queued');
    currentSocket.once('connect', () => {
      currentSocket.emit('avatar:position', { 
        position: { x, y }, 
        isDancing, 
        isWalking,
        name,
        color
      });
    });
  }
};

// Position-only update for existing avatars (doesn't send name/color)
export const emitAvatarPositionOnly = (x: number, y: number, isDancing: boolean = false, isWalking: boolean = false) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('avatar:position', { 
      position: { x, y }, 
      isDancing, 
      isWalking
      // No name or color - let server preserve existing values
    });
  } else {
    console.log('Socket not connected, position update queued');
    currentSocket.once('connect', () => {
      currentSocket.emit('avatar:position', { 
        position: { x, y }, 
        isDancing, 
        isWalking
      });
    });
  }
};

export const emitAvatarDance = (isDancing: boolean) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('avatar:dance', { isDancing });
  }
};

export const emitAvatarGreet = (isGreeting: boolean) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('avatar:greet', { isGreeting });
  }
};

export const emitAvatarJump = (isJumping: boolean) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('avatar:jump', { isJumping });
  }
};

export const emitAvatarMeditate = (isMeditating: boolean) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('avatar:meditate', { isMeditating });
  }
};

export const emitAvatarSleep = (isSleeping: boolean) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('avatar:sleep', { isSleeping });
  }
};

export const emitAvatarDie = (isDead: boolean) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('avatar:die', { isDead });
  }
};

export const emitProfileUpdate = (name: string, color: string) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('avatar:profile', { name, color });
  } else {
    console.log('Socket not connected, profile update queued');
    currentSocket.once('connect', () => {
      currentSocket.emit('avatar:profile', { name, color });
    });
  }
};

export const onAvatarMeditate = (callback: (data: { id: string; isMeditating: boolean }) => void) => {
  const currentSocket = getSocket();
  currentSocket.on('avatar:meditate', (data: { id: string; isMeditating: boolean }) => {
    callback(data);
  });
};

export const onAvatarsUpdate = (callback: (avatars: Avatar[]) => void) => {
  const currentSocket = getSocket();
  currentSocket.on('avatars:update', (serverAvatars: ServerAvatar[]) => {
    if (!Array.isArray(serverAvatars)) {
      console.warn('Received invalid avatars data:', serverAvatars);
      return;
    }

    const transformedAvatars = serverAvatars
      .filter(serverAvatar => serverAvatar && serverAvatar.id && serverAvatar.position)
      .map(serverAvatar => ({
        id: serverAvatar.id,
        x: serverAvatar.position.x,
        y: serverAvatar.position.y,
        color: serverAvatar.color,
        isDancing: serverAvatar.isDancing || false,
        isGreeting: serverAvatar.isGreeting || false,
        isJumping: serverAvatar.isJumping || false,
        isMeditating: serverAvatar.isMeditating || false,
        isSleeping: serverAvatar.isSleeping || false,
        isDead: serverAvatar.isDead || false,
        isWalking: serverAvatar.isWalking || false,
        name: serverAvatar.name
      }));
    callback(transformedAvatars);
  });
};

export const onAvatarDisconnect = (callback: (id: string) => void) => {
  getSocket().on('avatar:disconnect', (id: string) => {
    callback(id);
  });
};

export const emitAvatarWalk = (isWalking: boolean) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('avatar:walk', { isWalking });
  }
};

// Chat Functions
export const emitChatMessage = (message: ChatMessage) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('chatMessage', message);
  } else {
    console.log('Socket not connected, chat message queued');
    currentSocket.once('connect', () => {
      currentSocket.emit('chatMessage', message);
    });
  }
};

export const emitUpdateMessage = (message: ChatMessage) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('chatMessageUpdate', message);
  } else {
    console.log('Socket not connected, message update queued');
    currentSocket.once('connect', () => {
      currentSocket.emit('chatMessageUpdate', message);
    });
  }
};

export type AvatarSpeechPayload = { speakerId: string; text: string };

export const onAvatarSpeech = (callback: (payload: AvatarSpeechPayload) => void) => {
  const currentSocket = getSocket();
  currentSocket.on('avatar:speech', callback);
  return () => {
    currentSocket.off('avatar:speech', callback);
  };
};

export const onChatMessage = (callback: (message: ChatMessage) => void) => {
  const currentSocket = getSocket();
  currentSocket.on('chatMessage', callback);
  
  // Return cleanup function
  return () => {
    currentSocket.off('chatMessage', callback);
  };
};

export const onChatMessageUpdate = (callback: (message: ChatMessage) => void) => {
  const currentSocket = getSocket();
  currentSocket.on('chatMessageUpdate', callback);
  
  // Return cleanup function
  return () => {
    currentSocket.off('chatMessageUpdate', callback);
  };
};

// Music Functions
export const emitAddToQueue = (song: QueueItem) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('music:addToQueue', { song });
  } else {
    console.log('Socket not connected, add to queue queued');
    currentSocket.once('connect', () => {
      currentSocket.emit('music:addToQueue', { song });
    });
  }
};

export const emitSkipSong = () => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('music:skip');
  }
};

export const emitClearQueue = () => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('music:clear');
  }
};

export const emitRemoveSong = (index: number) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('music:remove', { index });
  } else {
    console.log('Socket not connected, remove song queued');
    currentSocket.once('connect', () => {
      currentSocket.emit('music:remove', { index });
    });
  }
};

export const emitShuffleQueue = () => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('music:shuffle');
  } else {
    console.log('Socket not connected, shuffle queue queued');
    currentSocket.once('connect', () => {
      currentSocket.emit('music:shuffle');
    });
  }
};

export const emitTimeUpdate = (currentTime: number, isPlaying: boolean) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('music:timeUpdate', { currentTime, isPlaying });
  }
};

export const emitPlayPause = (isPlaying: boolean) => {
  const currentSocket = getSocket();
  if (currentSocket.connected) {
    currentSocket.emit('music:playPause', { isPlaying });
  }
};

export const onMusicState = (callback: (state: MusicState) => void) => {
  const currentSocket = getSocket();
  currentSocket.on('music:state', callback);
  
  return () => {
    currentSocket.off('music:state', callback);
  };
};

export const onMusicTimeSync = (callback: (data: { currentTime: number; isPlaying: boolean; serverTime: number }) => void) => {
  const currentSocket = getSocket();
  currentSocket.on('music:timeSync', callback);
  
  return () => {
    currentSocket.off('music:timeSync', callback);
  };
};

export const onMusicPlaybackState = (callback: (data: { isPlaying: boolean; serverTime: number }) => void) => {
  const currentSocket = getSocket();
  currentSocket.on('music:playbackState', callback);
  
  return () => {
    currentSocket.off('music:playbackState', callback);
  };
};

export const onMusicQueueUpdate = (callback: (data: { queue: QueueItem[]; lastUpdateTime: number }) => void) => {
  const currentSocket = getSocket();
  currentSocket.on('music:queueUpdate', callback);
  
  return () => {
    currentSocket.off('music:queueUpdate', callback);
  };
}; 