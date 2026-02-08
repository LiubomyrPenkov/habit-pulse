import { Context } from 'telegraf';
import { database } from '../../database';
import { getMessage, tLocale, getLocale, getUnableToIdentifyUser, getPleaseUseStartFirst, getUserNotFound, getCommonError } from '../i18n';
import type { Locale } from '../i18n';

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatDate(date: Date): string {
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function getDateOnly(date: Date): string {
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

function isDateInMonth(date: Date, year: number, month: number): boolean {
  return date.getUTCFullYear() === year && date.getUTCMonth() === month;
}

function isDateInYear(date: Date, year: number): boolean {
  return date.getUTCFullYear() === year;
}

async function safeEditMessageText(ctx: Context, message: string, keyboard: any) {
  try {
    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (error: any) {
    const description = error?.description || error?.message || '';
    if (description.includes('message is not modified')) {
      await ctx.answerCbQuery(getMessage(ctx, 'stats_alreadyOnCurrentView'));
      return;
    }
    console.error('Failed to edit stats message:', error);
    await ctx.answerCbQuery(getMessage(ctx, 'stats_unableToUpdate'));
  }
}

// Store current month view for each user
const userMonthView = new Map<number, { year: number; month: number }>();

// Store selected habit for each user (to maintain selection during month navigation)
const userSelectedHabit = new Map<number, string>();

function getCurrentMonthView(telegramId: number): { year: number; month: number } {
  if (!userMonthView.has(telegramId)) {
    const now = new Date();
    userMonthView.set(telegramId, {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth(),
    });
  }
  return userMonthView.get(telegramId)!;
}

function setMonthView(telegramId: number, year: number, month: number) {
  userMonthView.set(telegramId, { year, month });
}

function getSelectedHabit(telegramId: number): string | undefined {
  return userSelectedHabit.get(telegramId);
}

function setSelectedHabit(telegramId: number, habitId: string | undefined) {
  if (habitId) {
    userSelectedHabit.set(telegramId, habitId);
  } else {
    userSelectedHabit.delete(telegramId);
  }
}

function generateCalendarView(logs: any[], year: number, month: number, locale: Locale): string {
  const loggedDates = new Set(
    logs.map((log) => getDateOnly(log.timestamp))
  );

  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const daysInMonth = lastDay.getUTCDate();
  const startingDayOfWeek = firstDay.getUTCDay();

  const monthNames = locale === 'uk'
    ? ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = locale === 'uk'
    ? ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  let calendar = `<pre>🗓 ${monthNames[month]} ${year}\n`;
  calendar += dayNames.join(' ') + '\n';

  // Add padding for first week
  let day = 1;
  let weekRow = ' '.repeat(startingDayOfWeek * 3);

  // Fill the calendar
  for (let i = startingDayOfWeek; i < 7 && day <= daysInMonth; i++) {
    const dateStr = day.toString().padStart(2, '0') + '.' + (month + 1).toString().padStart(2, '0') + '.' + year;
    const isLogged = loggedDates.has(dateStr);
    weekRow += (isLogged ? '✅' : day.toString().padStart(2, ' ')) + ' ';
    day++;
  }
  calendar += weekRow + '\n';

  // Rest of the weeks
  while (day <= daysInMonth) {
    weekRow = '';
    for (let i = 0; i < 7 && day <= daysInMonth; i++) {
      const dateStr = day.toString().padStart(2, '0') + '.' + (month + 1).toString().padStart(2, '0') + '.' + year;
      const isLogged = loggedDates.has(dateStr);
      weekRow += (isLogged ? '✅' : day.toString().padStart(2, ' ')) + ' ';
      day++;
    }
    calendar += weekRow + '\n';
  }

  calendar += '</pre>';
  return calendar;
}

async function buildStatsMessage(userId: any, telegramId: number, habits: any[], locale: Locale, habitId?: any) {
  const monthView = getCurrentMonthView(telegramId);

  let message = tLocale(locale, 'stats_yourStatistics') + '\n\n';

  const habitsToShow = habitId ? habits.filter(h => h._id.toString() === habitId.toString()) : habits;

  for (const habit of habitsToShow) {
    const logs = await database.dailyLogs
      .find({ habitId: habit._id, userId })
      .sort({ timestamp: -1 })
      .toArray();

    message += `<b>${habit.name}:</b>\n`;

    if (logs.length === 0) {
      message += tLocale(locale, 'stats_noLogsYet') + '\n';
      message += '─────\n\n';
      continue;
    }

    const logsThisMonth = logs.filter(log => isDateInMonth(log.timestamp, monthView.year, monthView.month));
    const logsThisYear = logs.filter(log => isDateInYear(log.timestamp, monthView.year));

    message += generateCalendarView(logs, monthView.year, monthView.month, locale) + '\n';
    message += `<b>${tLocale(locale, 'stats_totalThisMonth')} ${logsThisMonth.length}</b>\n`;
    message += `<b>${tLocale(locale, 'stats_totalThisYear')} ${logsThisYear.length}</b>\n`;
    message += '─────\n\n';
  }

  return message;
}

function getNavigationKeyboard(telegramId: number, locale: Locale) {
  const monthView = getCurrentMonthView(telegramId);
  const prevDate = new Date(Date.UTC(monthView.year, monthView.month - 1, 1));
  const nextDate = new Date(Date.UTC(monthView.year, monthView.month + 1, 1));

  return {
    inline_keyboard: [
      [
        {
          text: tLocale(locale, 'stats_prev'),
          callback_data: `stats_prev_${telegramId}_${prevDate.getUTCFullYear()}_${prevDate.getUTCMonth()}`,
        },
        {
          text: tLocale(locale, 'stats_today'),
          callback_data: `stats_today_${telegramId}`,
        },
        {
          text: tLocale(locale, 'stats_next'),
          callback_data: `stats_next_${telegramId}_${nextDate.getUTCFullYear()}_${nextDate.getUTCMonth()}`,
        },
      ],
    ],
  };
}

function getHabitSelectionKeyboard(telegramId: number, habits: any[], locale: Locale) {
  const buttons = habits.map(habit => [
    {
      text: capitalizeFirstLetter(habit.name),
      callback_data: `stats_habit_${telegramId}_${habit._id}`,
    },
  ]);

  buttons.push([
    {
      text: tLocale(locale, 'stats_allHabits'),
      callback_data: `stats_habit_${telegramId}_all`,
    },
  ]);

  return {
    inline_keyboard: buttons,
  };
}

export async function statsCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  const locale = getLocale(ctx);

  if (!telegramId) {
    return ctx.reply(getUnableToIdentifyUser(ctx));
  }

  const user = await database.users.findOne({ telegramId });

  if (!user || !user._id) {
    return ctx.reply(getPleaseUseStartFirst(ctx));
  }

  const habits = await database.habits.find({ userId: user._id }).toArray();

  if (habits.length === 0) {
    return ctx.reply(getMessage(ctx, 'viewHabits_noHabitsYet'));
  }

  if (habits.length === 1) {
    const message = await buildStatsMessage(user._id, telegramId, habits, locale);
    const keyboard = getNavigationKeyboard(telegramId, locale);

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } else {
    const keyboard = getHabitSelectionKeyboard(telegramId, habits, locale);
    await ctx.reply(getMessage(ctx, 'stats_selectHabitToViewStats'), {
      reply_markup: keyboard,
    });
  }
}

export async function handleStatsNavigation(ctx: Context) {
  const callbackData = (ctx.callbackQuery as any)?.data;
  const telegramId = ctx.from?.id;
  const locale = getLocale(ctx);

  if (!callbackData || !telegramId) {
    return ctx.answerCbQuery(getCommonError(ctx));
  }

  if (callbackData.startsWith('stats_habit_')) {
    const parts = callbackData.split('_');
    const habitId = parts[3];
    const isAll = habitId === 'all';

    const user = await database.users.findOne({ telegramId });
    if (!user || !user._id) {
      return ctx.answerCbQuery(getUserNotFound(ctx));
    }

    const habits = await database.habits.find({ userId: user._id }).toArray();
    if (habits.length === 0) {
      return ctx.answerCbQuery(getMessage(ctx, 'stats_noHabitsFound'));
    }

    const selectedHabit = isAll ? undefined : habitId;
    setSelectedHabit(telegramId, selectedHabit);
    const message = await buildStatsMessage(user._id, telegramId, habits, locale, selectedHabit);
    const keyboard = getNavigationKeyboard(telegramId, locale);

    await safeEditMessageText(ctx, message, keyboard);
    await ctx.answerCbQuery();
    return;
  }

  // Handle month navigation
  if (callbackData.startsWith('stats_today_')) {
    const now = new Date();
    setMonthView(telegramId, now.getUTCFullYear(), now.getUTCMonth());
  } else if (callbackData.startsWith('stats_prev_')) {
    const parts = callbackData.split('_');
    const year = parseInt(parts[3]);
    const month = parseInt(parts[4]);
    setMonthView(telegramId, year, month);
  } else if (callbackData.startsWith('stats_next_')) {
    const parts = callbackData.split('_');
    const year = parseInt(parts[3]);
    const month = parseInt(parts[4]);
    setMonthView(telegramId, year, month);
  }

  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.answerCbQuery(getUserNotFound(ctx));
  }

  const habits = await database.habits.find({ userId: user._id }).toArray();
  if (habits.length === 0) {
    return ctx.answerCbQuery(getMessage(ctx, 'stats_noHabitsFound'));
  }

  const selectedHabit = getSelectedHabit(telegramId);
  const message = await buildStatsMessage(user._id, telegramId, habits, locale, selectedHabit);
  const keyboard = getNavigationKeyboard(telegramId, locale);

  await safeEditMessageText(ctx, message, keyboard);
  await ctx.answerCbQuery();
}

export async function handleViewHabitStats(ctx: Context) {
  const callbackData = (ctx.callbackQuery as any)?.data;
  const telegramId = ctx.from?.id;
  const locale = getLocale(ctx);

  if (!callbackData || !telegramId) {
    return ctx.answerCbQuery(getCommonError(ctx));
  }

  const parts = callbackData.split('_');
  const habitId = parts[3];

  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.answerCbQuery(getUserNotFound(ctx));
  }

  const habits = await database.habits.find({ userId: user._id }).toArray();
  if (habits.length === 0) {
    return ctx.answerCbQuery(getMessage(ctx, 'stats_noHabitsFound'));
  }

  setSelectedHabit(telegramId, habitId);
  const message = await buildStatsMessage(user._id, telegramId, habits, locale, habitId);
  const keyboard = getNavigationKeyboard(telegramId, locale);

  await safeEditMessageText(ctx, message, keyboard);
  await ctx.answerCbQuery();
}
