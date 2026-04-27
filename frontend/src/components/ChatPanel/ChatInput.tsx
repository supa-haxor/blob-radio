import React, { useState, useRef, useEffect } from 'react';
import { emitChatMessage, emitUpdateMessage, type ChatMessage } from '../../socket';
import { useAvatarActions } from '../../store/AvatarActionsStore';
import { useMusicQueue } from '../../store/MusicQueueStore';

interface ChatInputProps {
  userName: string;
  userColor: string;
  isVisible: boolean;
  onClose: () => void;
  onCommand: (helpMessage: ChatMessage) => void;
  onClearMessages: () => void;
  avatars: any[];
  selfId: string | null;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  userName, 
  userColor, 
  isVisible, 
  onClose,
  onCommand,
  onClearMessages,
  avatars,
  selfId
}) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Get avatar actions from store at component level
  const { triggerDance, triggerGreet, triggerJump, triggerMeditate, triggerSleep, triggerDie } = useAvatarActions();
  
  // Get music queue actions
  const { addToQueue, skipSong, clearQueue, removeFromQueue, shuffleQueue, getNext3Songs, currentSong, history } = useMusicQueue();

  // Clean YouTube URLs by removing parameters
  const cleanYouTubeUrls = (text: string): string => {
    // YouTube URL patterns to match and clean
    const youtubeRegex = /(https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11}))(?:[&?][^\s]*)?/g;
    
    return text.replace(youtubeRegex, (match, baseUrl, videoId) => {
      // Return clean YouTube URL based on the original format
      if (match.includes('youtu.be/')) {
        return `https://youtu.be/${videoId}`;
      } else {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    });
  };

  // Validate if URL is a valid YouTube URL
  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubePattern = /(https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11}))/;
    return youtubePattern.test(url);
  };

  // Focus input when it becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If message is empty, close the chat
    if (!message.trim()) {
      handleClose();
      return;
    }
    
    const trimmedMessage = message.trim();
    
    // Check for chat commands
    if (trimmedMessage.startsWith('/')) {
      handleChatCommand(trimmedMessage);
      setMessage('');
      onClose();
      if (inputRef.current) {
        inputRef.current.blur();
      }
      return;
    }
    
    // Clean YouTube URLs in the message
    const cleanedMessage = cleanYouTubeUrls(trimmedMessage);
    
    // Create message object
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: cleanedMessage,
      sender: userName,
      timestamp: new Date(),
      senderColor: userColor,
      messageType: 'normal'
    };
    
    // Send message via socket
    emitChatMessage(newMessage);
    console.log('Sending message via socket:', newMessage);
    
    setMessage('');
    onClose();
    // Blur the input to deselect it
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleChatCommand = (command: string) => {
    const commandParts = command.split(' ');
    const mainCommand = commandParts[0].toLowerCase();
    const args = commandParts.slice(1);
    
    switch (mainCommand) {
      case '/dance':
        // Check current dancing state
        const currentAvatar = avatars.find(a => a.id === selfId);
        const isCurrentlyDancing = currentAvatar?.isDancing || false;
        
        triggerDance();
        
        // Only send action message when starting to dance, not when stopping
        if (!isCurrentlyDancing) {
          const danceMessage: ChatMessage = {
            id: Date.now().toString(),
            text: `${userName} is dancing`,
            sender: '',  // No sender for action messages
            timestamp: new Date(),
            senderColor: '#D2691E',  // Light brown color
            messageType: 'action',
            broadcast: true  // Action messages are broadcast to other users
          };
          emitChatMessage(danceMessage);
        }
        break;
      case '/greet':
        triggerGreet();
        if (selfId) {
          const fromName =
            avatars.find((a) => a.id === selfId)?.name?.trim() ||
            userName.trim() ||
            'Anonymous';
          emitChatMessage({
            id: `${Date.now()}-${selfId}-greet-everyone`,
            text: '',
            sender: '',
            timestamp: new Date(),
            senderColor: '#D2691E',
            messageType: 'greetEveryone',
            greetFromId: selfId,
            greetFromName: fromName,
            broadcast: true,
          });
        }
        break;
      case '/jump':
        triggerJump();
        break;
      case '/meditate':
        // Check current meditating state (meditate is also a toggle like dance)
        const currentAvatarMed = avatars.find(a => a.id === selfId);
        const isCurrentlyMeditating = currentAvatarMed?.isMeditating || false;
        
        triggerMeditate();
        
        // Only send action message when starting to meditate, not when stopping
        if (!isCurrentlyMeditating) {
          const meditateMessage: ChatMessage = {
            id: Date.now().toString(),
            text: `${userName} is meditating`,
            sender: '',  // No sender for action messages
            timestamp: new Date(),
            senderColor: '#D2691E',  // Light brown color
            messageType: 'action',
            broadcast: true  // Action messages are broadcast to other users
          };
          emitChatMessage(meditateMessage);
        }
        break;
      case '/sleep': {
        const currentAvatarSleep = avatars.find(a => a.id === selfId);
        const isCurrentlySleeping = currentAvatarSleep?.isSleeping || false;

        triggerSleep();

        if (!isCurrentlySleeping) {
          const sleepMessage: ChatMessage = {
            id: Date.now().toString(),
            text: `${userName} falls asleep`,
            sender: '',
            timestamp: new Date(),
            senderColor: '#D2691E',
            messageType: 'action',
            broadcast: true,
          };
          emitChatMessage(sleepMessage);
        }
        break;
      }
      case '/die': {
        const wasDead = avatars.find((a) => a.id === selfId)?.isDead || false;
        triggerDie();
        if (!wasDead) {
          emitChatMessage({
            id: Date.now().toString(),
            text: `${userName} collapses`,
            sender: '',
            timestamp: new Date(),
            senderColor: '#D2691E',
            messageType: 'action',
            broadcast: true,
          });
        }
        break;
      }
      case '/play':
        if (args.length === 0) {
          showSystemMessage('Usage: /play [YouTube URL or Playlist URL]', false);
        } else {
          const url = args.join(' ');
          
          // Clean YouTube URLs to remove parameters
          const cleanedUrl = cleanYouTubeUrls(url);
          
          // Validate URL before showing loading message
          const isValidUrl = isValidYouTubeUrl(cleanedUrl);
          
          if (!isValidUrl) {
            // Show error immediately without loading message
            const errorMessage: ChatMessage = {
              id: Date.now().toString(),
              text: 'Please paste a valid YouTube link',
              sender: '',  // No sender for quiet messages
              timestamp: new Date(),
              senderColor: '#9CA3AF',  // Grey color
              messageType: 'quiet',
              broadcast: false
            };
            onCommand(errorMessage);
            return;
          }
          
          // Create initial message and store its ID
          const loadingMessageId = Date.now().toString();
          const loadingMessage: ChatMessage = {
            id: loadingMessageId,
            text: `${userName} is adding a song to queue... 🎵`,
            sender: 'Notification',
            timestamp: new Date(),
            senderColor: '#FF6B35',
            messageType: 'notification',
            broadcast: true
          };
          emitChatMessage(loadingMessage);
          
          addToQueue(cleanedUrl, userName).then((result) => {
            if (result.success) {
              // Update the loading message instead of creating a new one
              const updatedMessage: ChatMessage = {
                id: loadingMessageId, // Keep the same ID
                text: result.count && result.count > 1 
                  ? `${userName} added ${result.songTitle} to queue! 🎵📋`
                  : `${userName} added "${result.songTitle}" to queue! 🎵`,
                sender: 'Notification',
                timestamp: new Date(),
                senderColor: '#FF6B35',
                messageType: 'notification',
                broadcast: true
              };
              emitUpdateMessage(updatedMessage);
            } else {
              // Handle error with quiet message
              const errorMessage: ChatMessage = {
                id: loadingMessageId, // Keep the same ID
                text: result.errorMessage || 'Please paste a valid YouTube link',
                sender: '',  // No sender for quiet messages
                timestamp: new Date(),
                senderColor: '#9CA3AF',  // Grey color
                messageType: 'quiet',
                broadcast: false
              };
              onCommand(errorMessage);
            }
          }).catch((error) => {
            console.error('Error adding to queue:', error);
            // Update the loading message to show error
            const errorMessage: ChatMessage = {
              id: loadingMessageId, // Keep the same ID
              text: 'Please paste a valid YouTube link',
              sender: '',  // No sender for quiet messages
              timestamp: new Date(),
              senderColor: '#9CA3AF',  // Grey color
              messageType: 'quiet',
              broadcast: false
            };
            onCommand(errorMessage);
          });
        }
        break;
      case '/skip':
        // Check if this is the last song before skipping
        const upcomingSongs = getNext3Songs();
        const isLastSong = upcomingSongs.length === 0 && currentSong;
        
        if (!currentSong) {
          const noSongMessage: ChatMessage = {
            id: Date.now().toString(),
            text: 'No song is currently playing.',
            sender: '',  // No sender for quiet messages
            timestamp: new Date(),
            senderColor: '#9CA3AF',  // Grey color
            messageType: 'quiet',
            broadcast: false
          };
          onCommand(noSongMessage);
        } else {
          skipSong();
          if (isLastSong) {
            showSystemMessage(`${userName} skipped the last song - music stopped 🛑`);
          } else {
            showSystemMessage(`${userName} skipped the current song! ⏭️`);
          }
        }
        break;
      case '/clear':
        // Clear all chat messages (only for the user who typed the command)
        onClearMessages();
        break;
      case '/stop':
        // Check if there's anything to stop
        const songsToStop = getNext3Songs();
        if (!currentSong && songsToStop.length === 0) {
          const nothingToStopMessage: ChatMessage = {
            id: Date.now().toString(),
            text: 'No music playing.',
            sender: '',  // No sender for quiet messages
            timestamp: new Date(),
            senderColor: '#9CA3AF',  // Grey color
            messageType: 'quiet',
            broadcast: false
          };
          onCommand(nothingToStopMessage);
        } else {
          clearQueue();
          showSystemMessage(`${userName} stopped the music! 🛑`);
        }
        break;
      case '/remove':
        if (args.length === 0) {
          const removeUsageMessage: ChatMessage = {
            id: Date.now().toString(),
            text: 'Usage: /remove [index] - removes upcoming song from queue\n(1 = first upcoming song, cannot remove currently playing)',
            sender: '',  // No sender for quiet messages
            timestamp: new Date(),
            senderColor: '#9CA3AF',  // Grey color
            messageType: 'quiet',
            broadcast: false
          };
          onCommand(removeUsageMessage);
        } else {
          const userIndex = parseInt(args[0]);
          if (isNaN(userIndex) || userIndex < 1) {
            const invalidNumberMessage: ChatMessage = {
              id: Date.now().toString(),
              text: 'Please provide a valid number (1 or higher).',
              sender: '',  // No sender for quiet messages
              timestamp: new Date(),
              senderColor: '#9CA3AF',  // Grey color
              messageType: 'quiet',
              broadcast: false
            };
            onCommand(invalidNumberMessage);
          } else {
            const upcomingSongs = getNext3Songs();
            if (upcomingSongs.length === 0) {
              const noSongsMessage: ChatMessage = {
                id: Date.now().toString(),
                text: 'No songs in the queue.',
                sender: '',  // No sender for quiet messages
                timestamp: new Date(),
                senderColor: '#9CA3AF',  // Grey color
                messageType: 'quiet',
                broadcast: false
              };
              onCommand(noSongsMessage);
            } else if (userIndex > upcomingSongs.length) {
              const songNotExistMessage: ChatMessage = {
                id: Date.now().toString(),
                text: `Song in position ${userIndex} does not exist. Only ${upcomingSongs.length} upcoming songs in queue.`,
                sender: '',  // No sender for quiet messages
                timestamp: new Date(),
                senderColor: '#9CA3AF',  // Grey color
                messageType: 'quiet',
                broadcast: false
              };
              onCommand(songNotExistMessage);
            } else {
              // Get the song being removed before removing it
              const songToRemove = upcomingSongs[userIndex - 1];
              // User index 1 = queue[1] (first upcoming), so we use userIndex directly  
              removeFromQueue(userIndex);
              showSystemMessage(`${userName} removed "${songToRemove.title}" from queue! 🗑️`);
            }
          }
        }
        break;
      case '/queue':
        const nextSongs = getNext3Songs();
        if (!currentSong && nextSongs.length === 0) {
          const emptyQueueMessage: ChatMessage = {
            id: Date.now().toString(),
            text: '🎵 Queue is empty! Use /play [YouTube URL] to add songs',
            sender: 'System',
            timestamp: new Date(),
            senderColor: '#6366F1',
            messageType: 'system',
            broadcast: false
          };
          onCommand(emptyQueueMessage);
        } else {
          let queueMessage = '';
          if (currentSong) {
            let currentSongInfo = `🎵 Now Playing: [${currentSong.title}`;
            if (currentSong.duration && currentSong.duration !== 'Unknown') {
              currentSongInfo += ` • ${currentSong.duration}`;
            }
            currentSongInfo += ']';
            queueMessage += currentSongInfo + '\n\n';
          }
          if (nextSongs.length > 0) {
            queueMessage += 'Up Next:\n';
            nextSongs.forEach((song, index) => {
              let songInfo = `${index + 1}. [${song.title}`;
              if (song.duration && song.duration !== 'Unknown') {
                songInfo += ` • ${song.duration}`;
              }
              songInfo += ']';
              queueMessage += songInfo + '\n';
            });
          } else if (currentSong) {
            queueMessage += 'No more songs in queue. Add more with /play [URL]';
          }
          // Send as system message with custom styling
          const systemMessage: ChatMessage = {
            id: Date.now().toString(),
            text: queueMessage,
            sender: 'System',
            timestamp: new Date(),
            senderColor: '#6366F1', // System message blue color
            messageType: 'system',
            broadcast: false,
            videoUrl: currentSong?.url // Add video URL for the current song
          };
          onCommand(systemMessage);
        }
        break;
      case '/history':
        if (history.length === 0) {
          const emptyHistoryMessage: ChatMessage = {
            id: Date.now().toString(),
            text: 'No songs played yet.',
            sender: '',
            timestamp: new Date(),
            senderColor: '#9CA3AF',
            messageType: 'quiet',
            broadcast: false
          };
          onCommand(emptyHistoryMessage);
        } else {
          let historyMessage = '📜 Recently played:\n\n';
          history.slice(0, 5).forEach((song, index) => {
            let songInfo = `${index + 1}. ${song.title}`;
            if (song.channelTitle && song.channelTitle !== 'Unknown Channel') {
              songInfo += ` - ${song.channelTitle}`;
            }
            if (song.duration && song.duration !== 'Unknown') {
              songInfo += ` (${song.duration})`;
            }
            historyMessage += songInfo + '\n';
          });
          if (history.length > 5) {
            historyMessage += `... and ${history.length - 5} more`;
          }
          const historySystemMessage: ChatMessage = {
            id: Date.now().toString(),
            text: historyMessage,
            sender: 'System',
            timestamp: new Date(),
            senderColor: '#6366F1',
            messageType: 'system',
            broadcast: false
          };
          onCommand(historySystemMessage);
        }
        break;
      case '/shuffle':
        // Check if there are enough songs to shuffle
        const upcomingSongsToShuffle = getNext3Songs();
        const totalSongsInQueue = currentSong ? upcomingSongsToShuffle.length + 1 : upcomingSongsToShuffle.length;
        
        if (totalSongsInQueue < 3) {
          const notEnoughSongsMessage: ChatMessage = {
            id: Date.now().toString(),
            text: 'Need at least 3 songs in queue to shuffle.',
            sender: '',  // No sender for quiet messages
            timestamp: new Date(),
            senderColor: '#9CA3AF',  // Grey color
            messageType: 'quiet',
            broadcast: false
          };
          onCommand(notEnoughSongsMessage);
        } else {
          shuffleQueue();
          showSystemMessage(`${userName} shuffled the queue! 🔀`);
        }
        break;
      case '/help':
        // Show help message (room-wide so everyone sees the command list)
        showSystemMessage('Available commands:\n\n' +
          'Avatar: /dance, /greet, /jump, /meditate, /sleep, /die\n\n' +
          'Music: /play [URL/Playlist], /skip, /clear, /stop, /remove [#], /queue, /history, /shuffle\n\n' +
          'Chat: /help, /clear', true);
        break;
      default:
        // Unknown command - show help message
        console.log('Unknown command:', command);
        showSystemMessage(`Unknown command: ${command}. Available commands:\n\n` +
          'Avatar: /dance, /greet, /jump, /meditate, /sleep, /die (chat only)\n\n' +
          'Music: /play [URL/Playlist], /skip, /clear, /stop, /remove [#], /queue, /history, /shuffle\n\n' +
          'Chat: /help, /clear',
          false);
        break;
    }
  };

  const showSystemMessage = (text: string, broadcast: boolean = true) => {
    // Check if this is a song-related notification message
    const isNotificationMessage = text.includes('🎵') || text.includes('⏭️') || text.includes('🗑️') || text.includes('📋') || text.includes('📜') || text.includes('🛑') || text.includes('🔀');
    
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: isNotificationMessage ? 'Notification' : 'System',
      timestamp: new Date(),
      senderColor: isNotificationMessage ? '#FF6B35' : '#6366F1', // Orange for notifications, purple-blue for system
      messageType: isNotificationMessage ? 'notification' : 'system',
      broadcast,
    };

    if (systemMessage.broadcast) {
      emitChatMessage(systemMessage);
    } else {
      onCommand(systemMessage);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="chat-input-form">
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="Type a message or command (/play, /queue, /skip, /history)..."
        className="chat-input"
      />
    </form>
  );
};

export default ChatInput; 