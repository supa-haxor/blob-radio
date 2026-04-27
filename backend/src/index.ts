const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000
});

const avatars = new Map<string, { x: number; y: number; color: string; isDancing?: boolean; isGreeting?: boolean; isJumping?: boolean; isMeditating?: boolean; isSleeping?: boolean; isDead?: boolean; isWalking?: boolean; name?: string }>();

function serializeAvatars(avatarsMap: Map<string, { x: number; y: number; color: string; isDancing?: boolean; isGreeting?: boolean; isJumping?: boolean; isMeditating?: boolean; isSleeping?: boolean; isDead?: boolean; isWalking?: boolean; name?: string }>) {
  return Array.from(avatarsMap.entries()).map(([id, data]) => ({
    id,
    position: { x: data.x, y: data.y },
    color: data.color,
    isDancing: data.isDancing,
    isGreeting: data.isGreeting,
    isJumping: data.isJumping,
    isMeditating: data.isMeditating,
    isSleeping: data.isSleeping,
    isDead: data.isDead,
    isWalking: data.isWalking,
    name: data.name || 'Anonymous'
  }));
}

// In-memory chat history
const recentMessages: any[] = [];
const MAX_MESSAGES = 50; // Increased back since 10 minutes is longer
const HISTORY_TIME_LIMIT = 10 * 60 * 1000; // 10 minutes in milliseconds
const CLEANUP_TIME_LIMIT = 20 * 60 * 1000; // 20 minutes for cleanup

// Music state management
interface QueueItem {
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

interface MusicState {
  currentSong: QueueItem | null;
  queue: QueueItem[];
  history: QueueItem[];
  currentTime: number;
  isPlaying: boolean;
  lastUpdateTime: number; // Server timestamp for sync
}

const musicState: MusicState = {
  currentSong: null,
  queue: [],
  history: [],
  currentTime: 0,
  isPlaying: false,
  lastUpdateTime: Date.now()
};

io.on('connection', (socket: any) => {
  socket.emit('avatars:update', serializeAvatars(avatars));

  socket.on('avatar:position', (data: { position: { x: number; y: number }; isDancing?: boolean; isWalking?: boolean; name?: string; color?: string }) => {
    // If this is a new avatar, use the provided color or generate a random one
    if (!avatars.has(socket.id)) {
      avatars.set(socket.id, {
        x: data.position.x,
        y: data.position.y,
        color: data.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
        isDancing: data.isDancing,
        isMeditating: false,
        isSleeping: false,
        isDead: false,
        isWalking: data.isWalking,
        name: data.name
      });
    } else {
      // Update position for existing avatar - preserve color and name from profile updates
      const currentAvatar = avatars.get(socket.id)!;
      avatars.set(socket.id, {
        ...currentAvatar,
        x: data.position.x,
        y: data.position.y,
        // Don't update color and name from position updates - these should only come from profile updates
        isDancing: data.isDancing,
        isMeditating: false,
        isSleeping: false,
        isDead: false,
        isWalking: data.isWalking
      });
    }

    io.emit('avatars:update', serializeAvatars(avatars));
  });

  socket.on('avatar:dance', (data: { isDancing: boolean }) => {
    if (avatars.has(socket.id)) {
      const avatar = avatars.get(socket.id)!;
      avatar.isDancing = data.isDancing;
      // Stop meditation when starting to dance
      if (data.isDancing) {
        avatar.isMeditating = false;
        avatar.isSleeping = false;
        avatar.isDead = false;
      }
      
      io.emit('avatars:update', serializeAvatars(avatars));
    }
  });

  socket.on('avatar:greet', (data: { isGreeting: boolean }) => {
    if (avatars.has(socket.id)) {
      const avatar = avatars.get(socket.id)!;
      avatar.isGreeting = data.isGreeting;
      // Stop meditation when starting to greet
      if (data.isGreeting) {
        avatar.isMeditating = false;
        avatar.isSleeping = false;
        avatar.isDead = false;
      }
      
      io.emit('avatars:update', serializeAvatars(avatars));
    }
  });

  socket.on('avatar:jump', (data: { isJumping: boolean }) => {
    if (avatars.has(socket.id)) {
      const avatar = avatars.get(socket.id)!;
      avatar.isJumping = data.isJumping;
      // Stop meditation when starting to jump
      if (data.isJumping) {
        avatar.isMeditating = false;
        avatar.isSleeping = false;
        avatar.isDead = false;
      }
      
      io.emit('avatars:update', serializeAvatars(avatars));
    }
  });

  socket.on('avatar:meditate', (data: { isMeditating: boolean }) => {
    if (avatars.has(socket.id)) {
      const avatar = avatars.get(socket.id)!;
      avatar.isMeditating = data.isMeditating;
      // Stop dancing when starting to meditate
      if (data.isMeditating) {
        avatar.isDancing = false;
        avatar.isSleeping = false;
        avatar.isDead = false;
      }
      
      io.emit('avatars:update', serializeAvatars(avatars));
    }
  });

  socket.on('avatar:sleep', (data: { isSleeping: boolean }) => {
    if (avatars.has(socket.id)) {
      const avatar = avatars.get(socket.id)!;
      avatar.isSleeping = data.isSleeping;
      if (data.isSleeping) {
        avatar.isDancing = false;
        avatar.isMeditating = false;
        avatar.isDead = false;
      }

      io.emit('avatars:update', serializeAvatars(avatars));
    }
  });

  socket.on('avatar:die', (data: { isDead: boolean }) => {
    if (avatars.has(socket.id)) {
      const avatar = avatars.get(socket.id)!;
      avatar.isDead = data.isDead;
      if (data.isDead) {
        avatar.isDancing = false;
        avatar.isMeditating = false;
        avatar.isSleeping = false;
      }
      io.emit('avatars:update', serializeAvatars(avatars));
    }
  });

  socket.on('avatar:profile', (data: { name: string; color: string }) => {
    if (avatars.has(socket.id)) {
      const avatar = avatars.get(socket.id)!;
      // Update only name and color, preserve all other states
      avatar.name = data.name;
      avatar.color = data.color;
      
      io.emit('avatars:update', serializeAvatars(avatars));
    }
  });

  // Chat message handler
  socket.on('chatMessage', (message: any) => {
    // Store message in memory buffer
    recentMessages.push(message);
    
    // Clean up old messages (both by count and by time)
    const now = new Date().getTime();
    const cleanupTime = now - CLEANUP_TIME_LIMIT;
    
    // Remove messages older than 20 minutes
    while (recentMessages.length > 0) {
      const oldestMessage = recentMessages[0];
      const messageTime = new Date(oldestMessage.timestamp).getTime();
      if (messageTime < cleanupTime) {
        recentMessages.shift();
      } else {
        break;
      }
    }
    
    // Also enforce max message count as backup
    if (recentMessages.length > MAX_MESSAGES) {
      recentMessages.shift();
    }
    
    // Only broadcast if the message is meant to be broadcast
    if (message.broadcast !== false) {
      io.emit('chatMessage', message);
    } else {
      // Send only to the sender
      socket.emit('chatMessage', message);
    }

    // Speech bubble over avatar: typed normal chat only; speaker id from socket (not client payload)
    if (message?.messageType === 'normal' && typeof message?.text === 'string') {
      const trimmed = message.text.trim();
      if (trimmed.length > 0) {
        const text = trimmed.slice(0, 400);
        const payload = { speakerId: socket.id, text };
        if (message.broadcast !== false) {
          io.emit('avatar:speech', payload);
        } else {
          socket.emit('avatar:speech', payload);
        }
      }
    }
  });

  // Chat message update handler
  socket.on('chatMessageUpdate', (message: any) => {
    // Update message in memory buffer
    const messageIndex = recentMessages.findIndex(msg => msg.id === message.id);
    if (messageIndex !== -1) {
      recentMessages[messageIndex] = message;
    }
    
    // Only broadcast if the message is meant to be broadcast
    if (message.broadcast !== false) {
      io.emit('chatMessageUpdate', message);
    } else {
      // Send only to the sender
      socket.emit('chatMessageUpdate', message);
    }
  });

  // Music event handlers
  
  // Send current music state to newly connected client
  socket.emit('music:state', musicState);

  // Add song to queue
  socket.on('music:addToQueue', (data: { song: QueueItem }) => {
    musicState.queue.push(data.song);
    musicState.lastUpdateTime = Date.now();
    
    // Only start playing if there's truly no current song and this is the first song
    if (!musicState.currentSong && musicState.queue.length === 1) {
      musicState.currentSong = musicState.queue[0];
      musicState.currentTime = 0;
      musicState.isPlaying = true;
      
      // Only emit music state when currentSong changes (first song added)
      io.emit('music:state', musicState);
    } else {
      // Just emit a queue update without affecting the current song
      io.emit('music:queueUpdate', {
        queue: musicState.queue,
        lastUpdateTime: musicState.lastUpdateTime
      });
    }
  });

  // Skip to next song
  socket.on('music:skip', () => {
    if (musicState.currentSong) {
      // Move current song to history
      musicState.history.unshift(musicState.currentSong);
      
      // Remove current song from queue
      musicState.queue.shift();
      
      // Set next song or null if queue is empty
      musicState.currentSong = musicState.queue.length > 0 ? musicState.queue[0] : null;
      musicState.currentTime = 0;
      musicState.isPlaying = !!musicState.currentSong;
      musicState.lastUpdateTime = Date.now();
      
      io.emit('music:state', musicState);
    }
  });

  // Clear entire queue
  socket.on('music:clear', () => {
    musicState.queue = [];
    musicState.currentSong = null;
    musicState.currentTime = 0;
    musicState.isPlaying = false;
    musicState.lastUpdateTime = Date.now();
    
    io.emit('music:state', musicState);
  });

  // Remove song from queue by index
  socket.on('music:remove', (data: { index: number }) => {
    if (data.index >= 0 && data.index < musicState.queue.length) {
      musicState.queue.splice(data.index, 1);
      
      // If we removed the current song, update current song
      if (data.index === 0) {
        musicState.currentSong = musicState.queue.length > 0 ? musicState.queue[0] : null;
        musicState.currentTime = 0;
        musicState.isPlaying = !!musicState.currentSong;
      }
      
      musicState.lastUpdateTime = Date.now();
      io.emit('music:state', musicState);
    }
  });

  // Shuffle queue
  socket.on('music:shuffle', () => {
    if (musicState.queue.length > 2) { // Need at least current song + 2 others to shuffle
      // Keep current song (index 0) in place, shuffle the rest
      const currentSong = musicState.queue[0];
      const remainingSongs = musicState.queue.slice(1);
      
      // Fisher-Yates shuffle algorithm
      for (let i = remainingSongs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingSongs[i], remainingSongs[j]] = [remainingSongs[j], remainingSongs[i]];
      }
      
      // Reconstruct queue with current song first, then shuffled songs
      musicState.queue = [currentSong, ...remainingSongs];
      musicState.lastUpdateTime = Date.now();
      
      io.emit('music:state', musicState);
    }
  });

  // Update playback time (for sync)
  socket.on('music:timeUpdate', (data: { currentTime: number; isPlaying: boolean }) => {
    musicState.currentTime = data.currentTime;
    musicState.isPlaying = data.isPlaying;
    musicState.lastUpdateTime = Date.now();
    
    // Broadcast to all other clients (not back to sender)
    socket.broadcast.emit('music:timeSync', {
      currentTime: data.currentTime,
      isPlaying: data.isPlaying,
      serverTime: musicState.lastUpdateTime
    });
  });

  // Play/pause control
  socket.on('music:playPause', (data: { isPlaying: boolean }) => {
    musicState.isPlaying = data.isPlaying;
    musicState.lastUpdateTime = Date.now();
    
    io.emit('music:playbackState', {
      isPlaying: data.isPlaying,
      serverTime: musicState.lastUpdateTime
    });
  });

  socket.on('disconnect', () => {
    avatars.delete(socket.id);
    io.emit('avatar:disconnect', socket.id);
    
    // Clear music state if this was the last user
    const remainingUsers = Array.from(avatars.keys());
    if (remainingUsers.length === 0) {
      musicState.currentSong = null;
      musicState.queue = [];
      musicState.history = [];
      musicState.currentTime = 0;
      musicState.isPlaying = false;
      musicState.lastUpdateTime = Date.now();
    }
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
}); 