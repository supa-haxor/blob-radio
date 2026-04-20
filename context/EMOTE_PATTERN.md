# Emote Addition Pattern

## Command Template

When the user says "add this emote" followed by an emote name, follow this exact pattern:

1. First, add socket communication:
   - Add emit function in socket.ts
   - Add event handler in socket.ts
   - Import in App.tsx

2. Update Avatar interface in App.tsx with new boolean property

3. Add context menu option in App.tsx

4. Add CSS animation in App.css

5. Update handleMenuAction in App.tsx

6. Ensure movement resets the emote state

## Emote Interaction Rules

1. **Movement Rules**
   - Moving resets all emote states for the moving avatar
   - Other avatars' emote states remain unchanged

2. **Emote State Interactions**
   - Each avatar's emote states are completely independent
   - One avatar's emotes should never affect another avatar's emotes
   - Some emotes may have specific interactions with other emotes:
     - Example: Meditation and dancing are mutually exclusive for the same avatar
     - Example: Starting any emote while meditating will stop meditation
   - These interactions should be clearly documented in the emote's implementation

3. **State Management**
   - Each emote should have its own boolean state property
   - State changes should only affect the avatar that triggered them
   - State updates should be properly synchronized across all clients

## Common Pitfalls to Check

- Socket events properly typed and handled
- State properly updated in setAvatars
- CSS z-index and visibility
- Movement resets emote state
- Animation timing and interruption
- Emote interactions properly implemented
- State changes only affect the triggering avatar

## Response Template

When user says "add this emote [name]", respond with:
"I'll add the [name] emote following our established pattern. First, I'll add the socket communication..."

Then proceed step by step, checking each common pitfall as we go.

## Example Implementation

```typescript
// In socket.ts
export const emitNewEmote = (isNewEmote: boolean) => {
  socket.emit('avatar:newEmote', isNewEmote);
};

socket.on('avatar:newEmote', (data: { id: string; isNewEmote: boolean }) => {
  // Handle remote emote state
});

// In App.tsx
const handleMenuAction = (action: string) => {
  if (action === 'NewEmote') {
    const isNewEmote = !avatars.find(a => a.id === selectedAvatar)?.isNewEmote;
    setAvatars(prev => prev.map(avatar => 
      avatar.id === selectedAvatar 
        ? { ...avatar, isNewEmote }
        : avatar
    ));
    emitNewEmote(isNewEmote);
  }
};

// In App.css
.avatar.newEmote {
  animation: newEmote 1s infinite;
}

@keyframes newEmote {
  // Define animation
}
```

## Testing Checklist

- [ ] Emote appears in context menu
- [ ] Clicking emote triggers animation
- [ ] Animation is visible to other users
- [ ] Moving avatar stops emote
- [ ] Multiple avatars can emote simultaneously
- [ ] Emote state persists until movement
- [ ] Animation is smooth and visible
- [ ] No console errors during emote
- [ ] Socket events are properly handled
- [ ] State is properly synchronized
- [ ] Emote interactions work as expected
- [ ] State changes only affect the triggering avatar

## Emote Implementation Guidelines

1. **State Properties**
   - Each emote should have a unique boolean state property
   - Property names should follow the pattern `is[EmoteName]`
   - Example: `isDancing`, `isMeditating`, `isGreeting`

2. **Socket Events**
   - Event names should follow the pattern `avatar:[emoteName]`
   - Data should include the avatar ID and emote state
   - Example: `avatar:dance`, `avatar:meditate`

3. **CSS Classes**
   - Class names should match the emote name in lowercase
   - Example: `.avatar.dancing`, `.avatar.meditating`

4. **Emote Interactions**
   - Document any specific interactions with other emotes
   - Implement interaction logic in the socket event handlers
   - Ensure interactions only affect the triggering avatar

5. **Animation Guidelines**
   - Animations should be smooth and non-disruptive
   - Consider z-index for complex emotes
   - Use appropriate timing and easing functions
   - Ensure animations work well with other emotes

## Key Considerations
1. Ensure emote state is included in all relevant interfaces
2. Implement proper socket communication for state synchronization
3. Design appropriate CSS animations for visual feedback
4. Handle state toggling in React components
5. Consider z-index and layering for complex emotes
6. Include proper cleanup and state reset mechanisms
7. Document and implement any required emote interactions
8. Ensure state changes are avatar-specific

# Emote Pattern Documentation

## Overview
This document outlines the pattern for implementing emotes in the application. Each emote follows a consistent structure across the frontend and backend.

## Pattern Structure

### 1. Frontend State
- Add boolean state to track emote status (e.g., `isDancing`, `isGreeting`, `isJumping`, `isMeditating`)
- State should be included in the avatar interface

### 2. Socket Communication
- Add emote state to both `Avatar` and `ServerAvatar` interfaces
- Implement emit function (e.g., `emitAvatarDance`, `emitAvatarGreet`, `emitAvatarJump`, `emitAvatarMeditate`)
- Include emote state in avatar transformation

### 3. CSS Animation
- Define animation keyframes
- Create class for the emote state
- Apply appropriate styling and effects

### 4. React Component
- Add emote class to avatar's className list
- Implement emote toggle in menu actions
- Handle emote state updates

## Example Implementation

### Dance Emote
```typescript
// Frontend state
interface Avatar {
  isDancing?: boolean;
}

// Socket
export const emitAvatarDance = (isDancing: boolean) => {
  socket.emit('avatar:dance', { isDancing });
};

// CSS
.avatar.dancing {
  animation: dance 0.5s infinite alternate;
}

// React
className={`avatar ${isDancing ? 'dancing' : ''}`}
```

### Greet Emote
```typescript
// Frontend state
interface Avatar {
  isGreeting?: boolean;
}

// Socket
export const emitAvatarGreet = (isGreeting: boolean) => {
  socket.emit('avatar:greet', { isGreeting });
};

// CSS
.avatar.greeting {
  animation: squeeze 0.3s ease-in-out 2;
}

// React
className={`avatar ${isGreeting ? 'greeting' : ''}`}
```

### Jump Emote
```typescript
// Frontend state
interface Avatar {
  isJumping?: boolean;
}

// Socket
export const emitAvatarJump = (isJumping: boolean) => {
  socket.emit('avatar:jump', { isJumping });
};

// CSS
.avatar.jumping {
  animation: jump 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 3;
}

// React
className={`avatar ${isJumping ? 'jumping' : ''}`}
```

### Meditate Emote
```typescript
// Frontend state
interface Avatar {
  isMeditating?: boolean;
}

// Socket
export const emitAvatarMeditate = (isMeditating: boolean) => {
  socket.emit('avatar:meditate', { isMeditating });
};

// CSS
.avatar.meditating {
  animation: meditate 3s ease-in-out infinite;
  z-index: 20;
}

.avatar.meditating .eyes {
  display: none;
}

.avatar.meditating::before {
  content: '☯';
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32px;
  color: white;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.9);
  z-index: 21;
  animation: spin 4s linear infinite;
}

// React
className={`avatar ${isMeditating ? 'meditating' : ''}`}
```

## Key Considerations
1. Ensure emote state is included in all relevant interfaces
2. Implement proper socket communication for state synchronization
3. Design appropriate CSS animations for visual feedback
4. Handle state toggling in React components
5. Consider z-index and layering for complex emotes
6. Include proper cleanup and state reset mechanisms 