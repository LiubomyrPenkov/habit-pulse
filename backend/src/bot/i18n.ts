import { Context } from 'telegraf';

export type Locale = 'uk' | 'en';

// ---------------------------------------------------------------------------
// Locale detection
// ---------------------------------------------------------------------------

/**
 * Detects user language from Telegram (language_code).
 * Ukrainian if "uk", otherwise English.
 */
export function getLocale(ctx: Context): Locale {
  const code = ctx.from?.language_code?.toLowerCase();
  return code?.startsWith('uk') ? 'uk' : 'en';
}

// ---------------------------------------------------------------------------
// Common messages
// ---------------------------------------------------------------------------

const common = {
  unableToIdentifyUser: {
    en: 'Unable to identify user.',
    uk: 'Не вдалося визначити користувача.',
  },
  /** Special display name for a certain someone 💕 */
  specialDisplayName: {
    en: 'My beautiful princess ❤️',
    uk: 'Пташко моя ❤️',
  },
} as const;

// ---------------------------------------------------------------------------
// Menu buttons (reply keyboard)
// ---------------------------------------------------------------------------

const menuButtons = {
  en: {
    add_habit: '➕ Add habit',
    view_habits: '📋 View habits',
    log_habit: '✅ Log habit',
    stats: '📊 Stats',
  },
  uk: {
    add_habit: '➕ Додати звичку',
    view_habits: '📋 Мої звички',
    log_habit: '✅ Записати звичку',
    stats: '📊 Статистика',
  },
} as const;

export type MenuCommand = 'add_habit' | 'view_habits' | 'log_habit' | 'stats';

/** Reply keyboard with main menu buttons. Pass as reply_markup to ctx.reply(). */
export function getStartKeyboard(locale: Locale): { keyboard: string[][]; resize_keyboard: true } {
  const b = menuButtons[locale];
  return {
    keyboard: [
      [b.add_habit, b.view_habits],
      [b.log_habit, b.stats],
    ],
    resize_keyboard: true,
  };
}

/** If the message text is a menu button label, returns the corresponding command; otherwise null. */
export function getMenuCommandFromText(ctx: Context, text: string): MenuCommand | null {
  const locale = getLocale(ctx);
  const b = menuButtons[locale];
  if (text === b.add_habit) return 'add_habit';
  if (text === b.view_habits) return 'view_habits';
  if (text === b.log_habit) return 'log_habit';
  if (text === b.stats) return 'stats';
  return null;
}

// ---------------------------------------------------------------------------
// Start command
// ---------------------------------------------------------------------------

function startWelcomeEn(displayName: string): string {
  return [
    `👋 Welcome to Habit Pulse, ${displayName}!`,
    '',
    "I'll help you track your daily habits and stay consistent.",
    '',
    "Let's build better habits together! 💪",
  ].join('\n');
}

function startWelcomeUk(displayName: string): string {
  return [
    `👋 Вітаю в Habit Pulse, ${displayName}!`,
    '',
    'Я допоможу тобі відстежувати звички та рухатись вперед.',
    '',
    'Разом до кращих звичок! 💪',
  ].join('\n');
}

const start = {
  welcome: {
    en: startWelcomeEn,
    uk: startWelcomeUk,
  },
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getStartWelcome(ctx: Context, displayName: string): string {
  return start.welcome[getLocale(ctx)](displayName);
}

export function getUnableToIdentifyUser(ctx: Context): string {
  return common.unableToIdentifyUser[getLocale(ctx)];
}

/** Localized special nickname (e.g. for your significant other). */
export function getSpecialDisplayName(ctx: Context): string {
  return common.specialDisplayName[getLocale(ctx)];
}
