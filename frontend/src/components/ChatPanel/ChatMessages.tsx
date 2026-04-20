import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  senderColor: string;
  messageType?: 'normal' | 'system' | 'notification' | 'quiet' | 'action';
  videoUrl?: string; // Add this for clickable song titles
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isInputVisible: boolean;
  onMessagesChange: (messages: ChatMessage[]) => void;
  onFadingMessagesChange: (fadingMessages: Set<string>) => void;
  isConnected: boolean;
}

// Constants for time-based cleanup
const FADE_START_TIME = 1 * 60 * 1000; // 1 minute
const REMOVAL_TIME = 10 * 60 * 1000; // 10 minutes
const SYSTEM_MESSAGE_LIFETIME = 10000; // 10 seconds for system messages
const CLEANUP_INTERVAL = 1000; // 1 second
const FADE_TRANSITION_DURATION = 300; // CSS transition duration

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isInputVisible,
  onMessagesChange,
  onFadingMessagesChange,
  isConnected
}) => {
  const [fadingMessages, setFadingMessages] = useState<Set<string>>(new Set());
  const [updatingMessages, setUpdatingMessages] = useState<Set<string>>(new Set());
  const messagesRef = useRef<HTMLDivElement>(null);
  const previousMessages = useRef<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync fading messages to parent - separate from state updates
  useEffect(() => {
    onFadingMessagesChange(fadingMessages);
  }, [fadingMessages, onFadingMessagesChange]);

  // Track message updates
  useEffect(() => {
    messages.forEach(msg => {
      const prevMsg = previousMessages.current.find(p => p.id === msg.id);
      if (prevMsg && prevMsg.text !== msg.text) {
        setUpdatingMessages(prev => {
          const newSet = new Set(prev);
          newSet.add(msg.id);
          return newSet;
        });
        // Remove updating class after animation
        setTimeout(() => {
          setUpdatingMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(msg.id);
            return newSet;
          });
        }, 400); // Match animation duration
      }
    });
    previousMessages.current = messages;
  }, [messages]);

  // Memoize visible messages
  const visibleMessages = useMemo(() => {
    // Get all non-system messages
    const regularMessages = messages.filter(msg => msg.messageType !== 'system');
    
    // Get the most recent system message if any exists
    const systemMessages = messages.filter(msg => msg.messageType === 'system');
    const lastSystemMessage = systemMessages.length > 0 ? systemMessages[systemMessages.length - 1] : null;
    
    // If there's a system message and it's not fading, include it
    if (lastSystemMessage && !fadingMessages.has(lastSystemMessage.id)) {
      return [...regularMessages, lastSystemMessage];
    }
    
    return regularMessages;
  }, [messages, fadingMessages]);

  // Memoized time formatting function
  const formatTime = useCallback((date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Format text with italics for bracketed content and make it clickable if it has a URL
  const formatTextWithItalics = useCallback((text: string, videoUrl?: string): React.ReactNode[] => {
    const parts = text.split(/(\[[^\]]*\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        if (videoUrl) {
          // Clickable content - both brackets and content in indigo
          return (
            <a 
              key={index}
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="song-link"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="clickable-content">
                {part}
              </span>
            </a>
          );
        } else {
          // Regular bracketed content - normal styling
          return <span key={index}>{part}</span>;
        }
      }
      return <span key={index}>{part}</span>;
    });
  }, []);

  // Helper function to get message age
  const getMessageAge = useCallback((timestamp: Date): number => {
    return Date.now() - new Date(timestamp).getTime();
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Handle initial fading when input closes
  useEffect(() => {
    if (!isInputVisible && messages.length > 0) {
      const oldMessageIds = messages
        .filter(msg => 
          msg.messageType !== 'system' && // Don't apply regular fading to system messages
          getMessageAge(msg.timestamp) > FADE_START_TIME
        )
        .map(msg => msg.id);
      
      if (oldMessageIds.length > 0) {
        setFadingMessages(new Set(oldMessageIds));
      }
    }
  }, [isInputVisible, messages, getMessageAge]);

  // Handle system message cleanup
  useEffect(() => {
    // Get all system messages
    const systemMessages = messages.filter(msg => msg.messageType === 'system');
    
    // If there are multiple system messages, remove all but the latest
    if (systemMessages.length > 1) {
      const lastSystemMessage = systemMessages[systemMessages.length - 1];
      const oldSystemMessages = systemMessages.slice(0, -1);
      
      // Remove old system messages
      const messagesToRemove = new Set(oldSystemMessages.map(m => m.id));
      onMessagesChange(messages.filter(msg => !messagesToRemove.has(msg.id)));
    }

    // Start fade timer for the latest system message
    if (systemMessages.length > 0) {
      const lastMessage = systemMessages[systemMessages.length - 1];
      if (!fadingMessages.has(lastMessage.id)) {
        setTimeout(() => {
          setFadingMessages(prev => new Set([...prev, lastMessage.id]));
        }, SYSTEM_MESSAGE_LIFETIME);
      }
    }

    // Remove messages that are already fading
    const messagesToRemove = messages.filter(msg => 
      msg.messageType === 'system' && fadingMessages.has(msg.id)
    );

    if (messagesToRemove.length > 0) {
      setTimeout(() => {
        const idsToRemove = new Set(messagesToRemove.map(m => m.id));
        onMessagesChange(messages.filter(msg => !idsToRemove.has(msg.id)));
      }, FADE_TRANSITION_DURATION);
    }
  }, [messages, fadingMessages, onMessagesChange]);

  // Message cleanup and fading logic
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      // Find regular messages to start fading
      const messagesToFade = messages
        .filter(msg => {
          const messageAge = now - new Date(msg.timestamp).getTime();
          return (
            msg.messageType !== 'system' && // Don't apply regular fading to system messages
            messageAge > FADE_START_TIME && 
            !fadingMessages.has(msg.id)
          );
        })
        .map(msg => msg.id);
      
      // Find regular messages to remove completely
      const messagesToRemove = messages.filter(msg => {
        const messageAge = now - new Date(msg.timestamp).getTime();
        return (
          msg.messageType !== 'system' && // Don't apply regular removal to system messages
          messageAge > REMOVAL_TIME
        );
      });

      // Update fading messages if needed
      if (messagesToFade.length > 0) {
        setFadingMessages(prev => {
          const newSet = new Set(prev);
          messagesToFade.forEach(id => newSet.add(id));
          return newSet;
        });
      }

      // Remove old messages if needed
      if (messagesToRemove.length > 0) {
        const idsToRemove = messagesToRemove.map(msg => msg.id);
        
        // Start fade-out for messages about to be removed
        setFadingMessages(prev => {
          const newSet = new Set(prev);
          idsToRemove.forEach(id => newSet.add(id));
          return newSet;
        });
        
        // Remove messages after fade transition
        setTimeout(() => {
          const updatedMessages = messages.filter(msg => 
            !idsToRemove.includes(msg.id)
          );
          onMessagesChange(updatedMessages);
          
          // Clean up fading state for removed messages
          setFadingMessages(prev => {
            const newSet = new Set(prev);
            idsToRemove.forEach(id => newSet.delete(id));
            return newSet;
          });
        }, FADE_TRANSITION_DURATION);
      }
    }, CLEANUP_INTERVAL);
    
    return () => clearInterval(cleanupInterval);
  }, [messages, fadingMessages, onMessagesChange]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Render empty state or messages
  const renderContent = () => {
    if (visibleMessages.length === 0) {
      return <div className="chat-empty">Press Enter to start chatting...</div>;
    }

    return messages.map(msg => {
      const messageClasses = [
        'chat-message',
        !isInputVisible && fadingMessages.has(msg.id) ? 'fading' : '',
        msg.messageType === 'notification' ? 'chat-message-notification' : '',
        msg.messageType === 'system' ? 'chat-message-system' : '',
        msg.messageType === 'quiet' ? 'chat-message-quiet' : '',
        msg.messageType === 'action' ? 'chat-message-action' : '',
        updatingMessages.has(msg.id) ? 'updating' : ''
      ].filter(Boolean).join(' ');

      return (
        <div key={msg.id} className={messageClasses}>
          {msg.messageType === 'notification' || msg.messageType === 'system' || msg.messageType === 'quiet' || msg.messageType === 'action' ? (
            // Notification, system, quiet, and action messages: only show the text
            <span className="chat-text">{formatTextWithItalics(msg.text, msg.videoUrl)}</span>
          ) : (
            // Regular messages: show full format
            <>
              <span className="chat-time">[{formatTime(msg.timestamp)}]</span>
              <span className="chat-sender" style={{ color: msg.senderColor }}>{msg.sender}:</span>
              <span className="chat-text">{formatTextWithItalics(msg.text, msg.videoUrl)}</span>
            </>
          )}
        </div>
      );
    });
  };

  return (
    <div className="chat-messages" ref={messagesRef}>
      {renderContent()}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages; 