# App architecture — mental model

**Why:** Map *who owns what* and *how updates flow*.

**This folder also has** `room-context.txt`, `avatar-context.txt`, `chat-context.txt`, `music-context.txt` — product/system notes. **When those disagree with `frontend/src/` or `backend/src/`, treat the code as source of truth** and update the `.txt` (this file is maintained against current providers/hooks).

---

## What “context” means in code

React **Context** = small **client-side stores**: each `*Provider` holds a slice; components use `use*` hooks. Scoped to the tree under that provider—not a global import singleton.

---

## Provider order (`frontend/src/App.tsx`, outer → inner)

Order matters when an inner hook needs an outer store.

```
MySession → Avatars → RoomUi → Chat → MusicQueue → AvatarActions → AppContent
```

Session = identity; avatars need a user id; room UI + chat = room chrome; music + avatar actions layer on the live room.

---

## Store map

| Hook | Responsibility |
|------|----------------|
| `useMySession` | Local user: name, color, background, `selfId`. |
| `useAvatars` | All players; positions and animation flags. |
| `useRoomUi` | Context menu anchor + selected avatar for the menu. |
| `useChat` | Chat input open + hover “peek” on the chat strip. |
| `useMusicQueue` | Shared queue / playback (see store file). |
| `useAvatarActions` | Dance, greet, jump, meditate for *your* avatar. |

---

## Re-renders (short)

Store update → provider re-renders → **only components that call that hook** re-run. Not a full page reload. Avoid one giant context value that changes often; **split stores** (table above).

---

## Where behavior lives (`frontend/src/`)

| Concern | Location |
|---------|----------|
| Floor click → move | `useRoomInteractions` + movement ref; gated when chat input open. |
| Long-press menu (others) | `Avatar` + timer ref from `RoomView`; delay in `config/roomUi.ts`. |
| Menu on-screen placement | `lib/contextMenuViewport.ts` + `config/roomUi.ts`. |
| Realtime | `useRoomSocket`, `socket.ts` |

---

## Config vs store

- **`config/`** — constants (durations, estimated menu sizes).
- **`store/`** — live UI/session state shared across components.

---

## New slice checklist

1. Shared across unrelated branches → new provider + hook; else local state or props.
2. If the provider value is a big object, keep it **stable** (`useMemo`) when fields don’t all change together.
