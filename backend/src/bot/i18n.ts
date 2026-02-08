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
  pleaseUseStartFirst: {
    en: 'Please use /start first to register.',
    uk: 'Спочатку натисни /start, щоб зареєструватися.',
  },
  userNotFound: {
    en: 'User not found.',
    uk: 'Користувача не знайдено.',
  },
  habitNotFound: {
    en: 'Habit not found.',
    uk: 'Звичку не знайдено.',
  },
  error: {
    en: 'Error',
    uk: 'Помилка',
  },
  errorOccurred: {
    en: 'Sorry, an error occurred. Please try again later.',
    uk: 'Виникла помилка. Спробуй пізніше.',
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
// All other messages (for t() lookup)
// ---------------------------------------------------------------------------

type MessagesMap = Record<string, { en: string; uk: string }>;

const messages: MessagesMap = {
  // addHabit
  addHabit_enterName: {
    en: 'Please enter the name of the habit you want to track:',
    uk: 'Введи назву звички, яку хочеш відстежувати:',
  },
  addHabit_habitAlreadyExists: {
    en: 'You already have a habit named "{habitName}". Please choose a different name.',
    uk: 'У тебе вже є звичка "{habitName}". Обери іншу назву.',
  },
  addHabit_setMonthlyTarget: {
    en: 'Great! Now set a monthly target for "{habitName}".\n\nHow many times per month do you want to do this habit?\n\nSend a number (e.g., 20) or "skip" to set no target.',
    uk: 'Тепер встанови місячну ціль для "{habitName}".\n\nСкільки разів на місяць ти хочеш виконувати цю звичку?\n\nНадішли число (наприклад, 20) або "skip", щоб не встановлювати ціль.',
  },
  addHabit_setYearlyTarget: {
    en: 'Now set a yearly target for "{habitName}".\n\nHow many times per year do you want to do this habit?\n\nSend a number (e.g., 200) or "skip" to set no target.',
    uk: 'Тепер встанови річну ціль для "{habitName}".\n\nСкільки разів на рік ти хочеш виконувати цю звичку?\n\nНадішли число (наприклад, 200) або "skip", щоб не встановлювати ціль.',
  },
  addHabit_validNumberOrSkip: {
    en: 'Please enter a valid positive number or "skip".',
    uk: 'Введи коректне додатне число або "skip".',
  },
  addHabit_habitCreated: {
    en: '✅ Habit "{habitName}" created successfully!{targetMsg}\n\nYou can now log it with /log_habit',
    uk: '✅ Звичку "{habitName}" створено!{targetMsg}\n\nТепер можна записувати її через /log_habit',
  },
  addHabit_targetMonthly: { en: '\n📊 Monthly target: ', uk: '\n📊 Місячна ціль: ' },
  addHabit_targetYearly: { en: '\n📊 Yearly target: ', uk: '\n📊 Річна ціль: ' },

  // viewHabits
  viewHabits_noHabitsYet: {
    en: "You don't have any habits yet. Use /add_habit to create one!",
    uk: 'У тебе ще немає звичок. Створи їх через /add_habit!',
  },
  viewHabits_selectToViewDetails: {
    en: '📋 Select a habit to view details:',
    uk: '📋 Обери звичку, щоб переглянути деталі:',
  },
  viewHabits_setMonthlyTargetFor: {
    en: 'Set monthly target for <b>{habitName}</b>\n\nHow many times per month?\n\nSend a number or "0" to remove the target.',
    uk: 'Встанови місячну ціль для <b>{habitName}</b>\n\nСкільки разів на місяць?\n\nНадішли число або "0", щоб прибрати ціль.',
  },
  viewHabits_setYearlyTargetFor: {
    en: 'Set yearly target for <b>{habitName}</b>\n\nHow many times per year?\n\nSend a number or "0" to remove the target.',
    uk: 'Встанови річну ціль для <b>{habitName}</b>\n\nСкільки разів на рік?\n\nНадішли число або "0", щоб прибрати ціль.',
  },
  viewHabits_validNumberZeroOrHigher: {
    en: 'Please enter a valid number (0 or higher).',
    uk: 'Введи коректне число (0 або більше).',
  },
  viewHabits_monthlyTargetUpdated: {
    en: '✅ Monthly target for "{habitName}" {targetMsg}!\n\nUse /view_habits to see updated details.',
    uk: '✅ Місячну ціль для "{habitName}" {targetMsg}!\n\nПереглянь деталі через /view_habits.',
  },
  viewHabits_yearlyTargetUpdated: {
    en: '✅ Yearly target for "{habitName}" {targetMsg}!\n\nUse /view_habits to see updated details.',
    uk: '✅ Річну ціль для "{habitName}" {targetMsg}!\n\nПереглянь деталі через /view_habits.',
  },
  viewHabits_targetRemoved: { en: 'removed', uk: 'прибрано' },
  viewHabits_targetSetTo: { en: 'set to {n}', uk: 'встановлено на {n}' },
  viewHabits_habitRemoved: {
    en: '🗑 Habit "{habitName}" removed.\n\nUse /view_habits to see remaining habits.',
    uk: '🗑 Звичку "{habitName}" видалено.\n\nПереглянь інші звички через /view_habits.',
  },
  viewHabits_created: { en: 'Created:', uk: 'Створено:' },
  viewHabits_lastLogged: { en: 'Last logged:', uk: 'Останній запис:' },
  viewHabits_targets: { en: 'Targets:', uk: 'Цілі:' },
  viewHabits_perMonth: { en: 'Per month:', uk: 'На місяць:' },
  viewHabits_perYear: { en: 'Per year:', uk: 'На рік:' },
  viewHabits_notSet: { en: 'Not set', uk: 'Не встановлено' },
  viewHabits_never: { en: 'Never', uk: 'Ніколи' },
  viewHabits_viewStats: { en: '📊 View Stats', uk: '📊 Статистика' },
  viewHabits_setMonthlyTargetBtn: { en: '📊 Set Monthly Target', uk: '📊 Місячна ціль' },
  viewHabits_setYearlyTargetBtn: { en: '📈 Set Yearly Target', uk: '📈 Річна ціль' },
  viewHabits_removeHabit: { en: '🗑 Remove Habit', uk: '🗑 Видалити звичку' },

  // logHabit
  logHabit_noActiveHabits: {
    en: "You don't have any active habits. Use /add_habit to create one!",
    uk: 'У тебе немає активних звичок. Створи їх через /add_habit!',
  },
  logHabit_selectToLog: {
    en: 'Select a habit to log:',
    uk: 'Обери звичку для запису:',
  },

  // logHabitCallback / logHabitText / logCustomDate
  log_whenToLog: {
    en: 'When do you want to log this habit?',
    uk: 'За яку дату записати цю звичку?',
  },
  log_today: { en: '📅 Today', uk: '📅 Сьогодні' },
  log_customDate: { en: '📆 Custom Date', uk: '📆 Інша дата' },
  log_alreadyLoggedToday: {
    en: '⚠️ "{habitName}" was already logged today.\n\nUse /log_habit to log another habit.',
    uk: '⚠️ "{habitName}" вже записано на сьогодні.\n\nВикористай /log_habit для іншої звички.',
  },
  log_loggedForTodayMessage: {
    en: '✅ Logged "{habitName}" for today!\n\nGreat job staying consistent! 💪\n\nUse /log_habit to log another habit or /stats to see your progress.',
    uk: '✅ Записано "{habitName}" на сьогодні!\n\nМолодець! 💪\n\nЗаписуй інші звички через /log_habit або дивись прогрес в /stats.',
  },
  log_enterDateCustom: {
    en: '📅 Enter the date for <b>{habitName}</b>\n\nFormat: DD.MM.YYYY (e.g., 01.02.2026)\n\nOr send "cancel" to go back.',
    uk: '📅 Введи дату для <b>{habitName}</b>\n\nФормат: ДД.ММ.РРРР (наприклад, 01.02.2026)\n\nАбо надішли "cancel", щоб скасувати.',
  },
  log_errorSelectingHabit: { en: 'Error selecting habit.', uk: 'Помилка вибору звички.' },
  log_habitNotFound: { en: 'Habit not found.', uk: 'Звичку не знайдено.' },
  log_userNotFound: { en: 'User not found', uk: 'Користувача не знайдено' },
  log_alreadyLoggedTodayShort: {
    en: 'Already logged today.',
    uk: 'Вже записано на сьогодні.',
  },
  log_loggedSuccess: { en: 'Logged successfully! 🎉', uk: 'Записано! 🎉' },
  log_errorLoggingHabit: { en: 'Error logging habit.', uk: 'Помилка запису звички.' },
  log_habitNotFoundName: {
    en: 'Habit "{habitName}" not found.',
    uk: 'Звичку "{habitName}" не знайдено.',
  },
  log_alreadyLoggedTodayInline: {
    en: '⚠️ "{habitName}" was already logged today.',
    uk: '⚠️ "{habitName}" вже записано на сьогодні.',
  },
  log_cancelled: {
    en: 'Cancelled. Use /log_habit to try again.',
    uk: 'Скасовано. Спробуй знову через /log_habit.',
  },
  log_invalidDateFormat: {
    en: 'Invalid date format. Please use DD.MM.YYYY (e.g., 01.02.2026)\n\nOr send "cancel" to go back.',
    uk: 'Невірний формат дати. Використовуй ДД.ММ.РРРР (наприклад, 01.02.2026)\n\nАбо надішли "cancel".',
  },
  log_invalidDateCheck: {
    en: 'Invalid date. Please check and try again.\n\nFormat: DD.MM.YYYY (e.g., 01.02.2026)\n\nOr send "cancel" to go back.',
    uk: 'Невірна дата. Перевір і спробуй знову.\n\nФормат: ДД.ММ.РРРР\n\nАбо надішли "cancel".',
  },
  log_cannotLogFutureDate: {
    en: 'You cannot log for a future date. Please enter a date from today or earlier.\n\nOr send "cancel" to go back.',
    uk: 'Не можна записувати на майбутню дату. Введи сьогоднішню або минулу дату.\n\nАбо надішли "cancel".',
  },
  log_alreadyLoggedForDate: {
    en: '⚠️ "{habitName}" was already logged for {date}.\n\nUse /log_habit to log another habit.',
    uk: '⚠️ "{habitName}" вже записано на {date}.\n\nВикористай /log_habit для іншої звички.',
  },
  log_loggedForDateMessage: {
    en: '✅ Logged "{habitName}" for {date}!\n\nGreat job staying consistent! 💪\n\nUse /log_habit to log another habit or /stats to see your progress.',
    uk: '✅ Записано "{habitName}" на {date}!\n\nМолодець! 💪\n\nЗаписуй інші звички через /log_habit або дивись прогрес в /stats.',
  },
  log_errorLoggingTryAgain: {
    en: 'Error logging habit. Please try again.',
    uk: 'Помилка запису. Спробуй ще раз.',
  },

  // stats
  stats_selectHabitToViewStats: {
    en: '📊 Select a habit to view stats:',
    uk: '📊 Обери звичку для перегляду статистики:',
  },
  stats_alreadyOnCurrentView: { en: 'Already on current view', uk: 'Вже на поточному екрані' },
  stats_unableToUpdate: { en: 'Unable to update stats', uk: 'Не вдалося оновити статистику' },
  stats_noHabitsFound: { en: 'No habits found', uk: 'Звичок не знайдено' },
  stats_noLogsYet: {
    en: 'No logs yet for this habit.\nUse /log_habit to start tracking!',
    uk: 'Записів ще немає.\nПочни відстежувати через /log_habit!',
  },
  stats_yourStatistics: { en: '📊 Your Statistics:', uk: '📊 Твоя статистика:' },
  stats_totalThisMonth: { en: 'Total this month:', uk: 'За місяць:' },
  stats_totalThisYear: { en: 'Total this year:', uk: 'За рік:' },
  stats_prev: { en: '◀️ Prev', uk: '◀️ Назад' },
  stats_today: { en: 'Today', uk: 'Сьогодні' },
  stats_next: { en: 'Next ▶️', uk: 'Вперед ▶️' },
  stats_allHabits: { en: '📊 All Habits', uk: '📊 Усі звички' },

  // testReminder
  testReminder_noEnabledHabits: {
    en: "You don't have any enabled habits to test with.",
    uk: 'У тебе немає активних звичок для тесту.',
  },
  testReminder_intro: {
    en: '⏰ Test Daily Reminder!\n\nThis is a test notification. Your habits are:\n\n',
    uk: '⏰ Тестовий нагадувач!\n\nЦе тестове повідомлення. Твої звички:\n\n',
  },
  testReminder_useLogHabit: { en: '\nUse /log_habit to track your progress! 💪', uk: '\nЗаписуй прогрес через /log_habit! 💪' },
  testReminder_sent: { en: '✅ Test reminder sent!', uk: '✅ Тестове нагадувач надіслано!' },
  testReminder_failed: { en: '❌ Failed to send test reminder.', uk: '❌ Не вдалося надіслати нагадувач.' },
};

/** Get localized message by key. Params: use {paramName} in message, pass { paramName: value }. */
export function getMessage(
  ctx: Context,
  key: keyof typeof messages,
  params?: Record<string, string | number>
): string {
  const locale = getLocale(ctx);
  let str = messages[key]?.[locale] ?? messages[key]?.en ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}

/** Get localized string by key when you only have locale (e.g. no ctx). */
export function tLocale(locale: Locale, key: keyof typeof messages, params?: Record<string, string | number>): string {
  let str = messages[key]?.[locale] ?? messages[key]?.en ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getStartWelcome(ctx: Context, displayName: string): string {
  return start.welcome[getLocale(ctx)](displayName);
}

export function getUnableToIdentifyUser(ctx: Context): string {
  return common.unableToIdentifyUser[getLocale(ctx)];
}

export function getPleaseUseStartFirst(ctx: Context): string {
  return common.pleaseUseStartFirst[getLocale(ctx)];
}

export function getUserNotFound(ctx: Context): string {
  return common.userNotFound[getLocale(ctx)];
}

export function getHabitNotFound(ctx: Context): string {
  return common.habitNotFound[getLocale(ctx)];
}

export function getErrorOccurred(ctx: Context): string {
  return common.errorOccurred[getLocale(ctx)];
}

export function getCommonError(ctx: Context): string {
  return common.error[getLocale(ctx)];
}

/** Localized special nickname (e.g. for your significant other). */
export function getSpecialDisplayName(ctx: Context): string {
  return common.specialDisplayName[getLocale(ctx)];
}
