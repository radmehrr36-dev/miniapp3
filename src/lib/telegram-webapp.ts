// Minimal typing for the Telegram WebApp SDK we load in layout.tsx.
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
      is_premium?: boolean;
    };
  };
  ready: () => void;
  expand: () => void;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
  MainButton?: unknown;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/** Returns the real Telegram WebApp instance if the app is opened inside Telegram. */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

/** Returns real initData string if present (only exists inside the Telegram client). */
export function getTelegramInitData(): string | null {
  const wa = getTelegramWebApp();
  if (wa && wa.initData && wa.initData.length > 0) {
    return wa.initData;
  }
  return null;
}
