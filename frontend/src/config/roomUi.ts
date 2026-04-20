/** Delay (ms) before the context menu opens when pressing another user's avatar on touch. */
export const timeToHoldToOpenContextMenuMs = 500;

/** `position: fixed` menu min-width matches `.context-menu` — used for viewport edge clamping. */
export const estimatedContextMenuWidthPx = 150;

/** Self menu: action buttons — tall. */
export const estimatedContextMenuHeightSelfPx = 200;

/** Other user's menu: single name line — must not use self height or bottom clamp shifts the menu too far up. */
export const estimatedContextMenuHeightOtherUserPx = 56;
