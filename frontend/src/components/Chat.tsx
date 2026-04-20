import React, { useState, useEffect, useRef } from 'react';
import '../styles/Chat.css';
import { onChatMessage, onChatMessageUpdate, emitUpdateMessage } from '../socket';
import ChatInput from './ChatPanel/ChatInput';
import ChatMessages from './ChatPanel/ChatMessages';
import { useAvatars } from '../store/AvatarsStore';
import { useChat } from '../store/ChatStore';
import { useMySession } from '../store/MySessionStore';

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  senderColor: string;
  messageType?: 'normal' | 'system' | 'notification' | 'quiet' | 'action';
}

const Chat: React.FC = () => {
  const { userName, selfColor, selfId } = useMySession();
  const displayName = userName || 'Anonymous';
  const displayColor = selfColor || '#FFD700';
  const { avatars } = useAvatars();
  const { isChatOpen, setChatOpen, isChatMessagesPeek, setChatMessagesPeek } =
    useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [fadingMessages, setFadingMessages] = useState<Set<string>>(new Set());
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Listen for incoming chat messages
  useEffect(() => {
    const handleChatMessage = (newMessage: ChatMessage) => {
      // Convert timestamp string back to Date object if needed
      const messageWithDate = {
        ...newMessage,
        timestamp: new Date(newMessage.timestamp)
      };
      setMessages(prev => [...prev, messageWithDate]);
    };

    const handleMessageUpdate = (updatedMessage: ChatMessage) => {
      // Convert timestamp string back to Date object if needed
      const messageWithDate = {
        ...updatedMessage,
        timestamp: new Date(updatedMessage.timestamp)
      };
      setMessages(prev => {
        const messageIndex = prev.findIndex(msg => msg.id === messageWithDate.id);
        if (messageIndex !== -1) {
          const newMessages = [...prev];
          newMessages[messageIndex] = messageWithDate;
          return newMessages;
        }
        return prev;
      });
    };

    const cleanup1 = onChatMessage(handleChatMessage);
    const cleanup2 = onChatMessageUpdate(handleMessageUpdate);

    // Cleanup listeners on component unmount
    return () => {
      cleanup1();
      cleanup2();
    };
  }, []);

  // Handle global key events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent opening chat if user is typing in another input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Enter' && !isChatOpen) {
        e.preventDefault();
        setChatOpen(true);
      } else if (e.key === 'Escape' && isChatOpen) {
        e.preventDefault();
        setChatOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isChatOpen]);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isChatOpen && chatContainerRef.current && !chatContainerRef.current.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        setChatOpen(false);
      }
    };

    if (isChatOpen) {
      document.addEventListener('click', handleClickOutside, true); // Use capture phase with click event
    }

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isChatOpen]);

  const handleCloseInput = () => {
    setChatOpen(false);
  };

  const handleCommandMessage = (message: ChatMessage) => {
    setMessages(prev => {
      // Check if we already have a message with this ID
      const messageIndex = prev.findIndex(msg => msg.id === message.id);
      if (messageIndex !== -1) {
        // Update existing message
        const newMessages = [...prev];
        newMessages[messageIndex] = message;
        // Emit update to other clients
        emitUpdateMessage(message);
        return newMessages;
      } else {
        // Add new message
        return [...prev, message];
      }
    });
  };

  const handleMessagesChange = (updatedMessages: ChatMessage[]) => {
    setMessages(updatedMessages);
  };

  const handleFadingMessagesChange = (updatedFadingMessages: Set<string>) => {
    setFadingMessages(updatedFadingMessages);
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  return (
    <div 
      ref={chatContainerRef}
      className={`chat-container${isChatOpen || isChatMessagesPeek ? ' opened' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isChatOpen) {
          setChatOpen(true);
        }
      }}
      onMouseEnter={() => setChatMessagesPeek(true)}
      onMouseLeave={() => setChatMessagesPeek(false)}
    >
      <ChatMessages
        messages={messages}
        isInputVisible={isChatOpen || isChatMessagesPeek}
        onMessagesChange={handleMessagesChange}
        onFadingMessagesChange={handleFadingMessagesChange}
        isConnected={true}
      />
      <ChatInput
        userName={displayName}
        userColor={displayColor}
        isVisible={isChatOpen}
        onClose={handleCloseInput}
        onCommand={handleCommandMessage}
        avatars={avatars}
        selfId={selfId}
        onClearMessages={handleClearMessages}
      />
    </div>
  );
};

export default Chat; 