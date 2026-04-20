import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

/** Chat panel: input open (typing), and message strip visible on hover. */
export interface ChatState {
  isChatOpen: boolean;
  setChatOpen: Dispatch<SetStateAction<boolean>>;
  isChatMessagesPeek: boolean;
  setChatMessagesPeek: Dispatch<SetStateAction<boolean>>;
}

const ChatContext = createContext<ChatState | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setChatOpen] = useState(false);
  const [isChatMessagesPeek, setChatMessagesPeek] = useState(false);

  const value = useMemo(
    () => ({
      isChatOpen,
      setChatOpen,
      isChatMessagesPeek,
      setChatMessagesPeek,
    }),
    [isChatOpen, isChatMessagesPeek]
  );

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}

export function useChat(): ChatState {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return ctx;
}
