const KEYS = {
  showWelcome: 'showWelcome',
  userName: 'userName',
  userColor: 'userColor',
  background: 'background',
} as const;

export function getStoredBackground(): string {
  return localStorage.getItem(KEYS.background) ?? 'forest';
}

/** Welcome screen unless user explicitly dismissed it. */
export function shouldShowWelcomeInitially(): boolean {
  return localStorage.getItem(KEYS.showWelcome) !== 'false';
}

/** Session marked ready when welcome was dismissed before. */
export function isReadyFromStoredWelcomeFlag(): boolean {
  return localStorage.getItem(KEYS.showWelcome) === 'false';
}

export function loadStoredProfile(): { name: string; color: string } | null {
  const name = localStorage.getItem(KEYS.userName);
  const color = localStorage.getItem(KEYS.userColor);
  if (name && color) return { name, color };
  return null;
}

export function persistProfile(name: string, color: string, background: string): void {
  localStorage.setItem(KEYS.userName, name);
  localStorage.setItem(KEYS.userColor, color);
  localStorage.setItem(KEYS.background, background);
}

export function persistBackground(background: string): void {
  localStorage.setItem(KEYS.background, background);
}
