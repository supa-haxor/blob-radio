import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAvatarSpeech } from '../socket';

const SPEECH_DURATION_MS = 5000;
const MAX_DISPLAY_CHARS = 200;

type Lines = Record<string, string>;

const AvatarSpeechContext = createContext<Lines | null>(null);

export function AvatarSpeechProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Lines>({});
  const genRef = useRef(new Map<string, number>());
  const timerRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    return onAvatarSpeech(({ speakerId, text }) => {
      const clipped =
        text.length > MAX_DISPLAY_CHARS
          ? `${text.slice(0, MAX_DISPLAY_CHARS)}…`
          : text;
      const nextGen = (genRef.current.get(speakerId) ?? 0) + 1;
      genRef.current.set(speakerId, nextGen);

      setLines((prev) => ({ ...prev, [speakerId]: clipped }));

      const prevT = timerRef.current.get(speakerId);
      if (prevT != null) window.clearTimeout(prevT);

      const t = window.setTimeout(() => {
        if (genRef.current.get(speakerId) !== nextGen) return;
        setLines((prev) => {
          const next = { ...prev };
          delete next[speakerId];
          return next;
        });
        timerRef.current.delete(speakerId);
      }, SPEECH_DURATION_MS);

      timerRef.current.set(speakerId, t);
    });
  }, []);

  useEffect(
    () => () => {
      timerRef.current.forEach((handle) => window.clearTimeout(handle));
      timerRef.current.clear();
    },
    []
  );

  const value = useMemo(() => lines, [lines]);

  return (
    <AvatarSpeechContext.Provider value={value}>
      {children}
    </AvatarSpeechContext.Provider>
  );
}

export function useAvatarSpeechLine(avatarId: string): string | undefined {
  const ctx = useContext(AvatarSpeechContext);
  if (!ctx) return undefined;
  return ctx[avatarId];
}
