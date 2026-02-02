import { Context } from 'telegraf';
import { database } from '../../database';

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
      await ctx.answerCbQuery('Already on current view');
      return;
    }
    console.error('Failed to edit stats message:', error);
    await ctx.answerCbQuery('Unable to update stats');
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

function generateCalendarView(logs: any[], year: number, month: number): string {
  // Get all logged dates
  const loggedDates = new Set(
    logs.map((log) => getDateOnly(log.timestamp))
  );

  // Get first day of month and number of days
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const daysInMonth = lastDay.getUTCDate();
  const startingDayOfWeek = firstDay.getUTCDay();

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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

async function buildStatsMessage(userId: any, telegramId: number, habits: any[], habitId?: any) {
  const monthView = getCurrentMonthView(telegramId);

  let message = '📊 Your Statistics:\n\n';

  // Filter habits if habitId is provided
  const habitsToShow = habitId ? habits.filter(h => h._id.toString() === habitId.toString()) : habits;

  // Add calendar for each habit
  for (const habit of habitsToShow) {
    const logs = await database.dailyLogs
      .find({ habitId: habit._id, userId })
      .sort({ timestamp: -1 })
      .toArray();

    message += `<b>${habit.name}:</b>\n`;

    if (logs.length === 0) {
      message += 'No logs yet for this habit.\nUse /log_habit to start tracking!\n';
      message += '─────\n\n';
      continue;
    }

    // Count logs for this month and year
    const logsThisMonth = logs.filter(log => isDateInMonth(log.timestamp, monthView.year, monthView.month));
    const logsThisYear = logs.filter(log => isDateInYear(log.timestamp, monthView.year));

    message += generateCalendarView(logs, monthView.year, monthView.month) + '\n';
    message += `<b>Total this month: ${logsThisMonth.length}</b>\n`;
    message += `<b>Total this year: ${logsThisYear.length}</b>\n`;
    message += '─────\n\n';
  }

  return message;
}

function getNavigationKeyboard(telegramId: number) {
  const monthView = getCurrentMonthView(telegramId);
  const prevDate = new Date(Date.UTC(monthView.year, monthView.month - 1, 1));
  const nextDate = new Date(Date.UTC(monthView.year, monthView.month + 1, 1));

  return {
    inline_keyboard: [
      [
        {
          text: '◀️ Prev',
          callback_data: `stats_prev_${telegramId}_${prevDate.getUTCFullYear()}_${prevDate.getUTCMonth()}`,
        },
        {
          text: 'Today',
          callback_data: `stats_today_${telegramId}`,
        },
        {
          text: 'Next ▶️',
          callback_data: `stats_next_${telegramId}_${nextDate.getUTCFullYear()}_${nextDate.getUTCMonth()}`,
        },
      ],
    ],
  };
}

function getHabitSelectionKeyboard(telegramId: number, habits: any[]) {
  const buttons = habits.map(habit => [
    {
      text: capitalizeFirstLetter(habit.name),
      callback_data: `stats_habit_${telegramId}_${habit._id}`,
    },
  ]);

  // Add "All Habits" button at the end
  buttons.push([
    {
      text: '📊 All Habits',
      callback_data: `stats_habit_${telegramId}_all`,
    },
  ]);

  return {
    inline_keyboard: buttons,
  };
}

export async function statsCommand(ctx: Context) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    return ctx.reply('Unable to identify user.');
  }

  const user = await database.users.findOne({ telegramId });

  if (!user || !user._id) {
    return ctx.reply('Please use /start first to register.');
  }

  const habits = await database.habits.find({ userId: user._id }).toArray();

  if (habits.length === 0) {
    return ctx.reply('You don\'t have any habits yet. Use /add_habit to create one!');
  }

  // If only one habit, show stats directly
  if (habits.length === 1) {
    const message = await buildStatsMessage(user._id, telegramId, habits);
    const keyboard = getNavigationKeyboard(telegramId);

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } else {
    // Show habit selection buttons
    const keyboard = getHabitSelectionKeyboard(telegramId, habits);
    await ctx.reply('📊 Select a habit to view stats:', {
      reply_markup: keyboard,
    });
  }
}

export async function handleStatsNavigation(ctx: Context) {
  const callbackData = (ctx.callbackQuery as any)?.data;
  const telegramId = ctx.from?.id;

  if (!callbackData || !telegramId) {
    return ctx.answerCbQuery('Error');
  }

  // Handle habit selection
  if (callbackData.startsWith('stats_habit_')) {
    const parts = callbackData.split('_');
    const habitId = parts[3];
    const isAll = habitId === 'all';

    const user = await database.users.findOne({ telegramId });
    if (!user || !user._id) {
      return ctx.answerCbQuery('User not found');
    }

    const habits = await database.habits.find({ userId: user._id }).toArray();
    if (habits.length === 0) {
      return ctx.answerCbQuery('No habits found');
    }

    const selectedHabit = isAll ? undefined : habitId;
    setSelectedHabit(telegramId, selectedHabit);
    const message = await buildStatsMessage(user._id, telegramId, habits, selectedHabit);
    const keyboard = getNavigationKeyboard(telegramId);

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

  // Refresh stats message
  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.answerCbQuery('User not found');
  }

  const habits = await database.habits.find({ userId: user._id }).toArray();
  if (habits.length === 0) {
    return ctx.answerCbQuery('No habits found');
  }

  // Use the selected habit if available
  const selectedHabit = getSelectedHabit(telegramId);
  const message = await buildStatsMessage(user._id, telegramId, habits, selectedHabit);
  const keyboard = getNavigationKeyboard(telegramId);

  await safeEditMessageText(ctx, message, keyboard);
  await ctx.answerCbQuery();
}

export async function handleViewHabitStats(ctx: Context) {
  const callbackData = (ctx.callbackQuery as any)?.data;
  const telegramId = ctx.from?.id;

  if (!callbackData || !telegramId) {
    return ctx.answerCbQuery('Error');
  }

  const parts = callbackData.split('_');
  const habitId = parts[3];

  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.answerCbQuery('User not found');
  }

  const habits = await database.habits.find({ userId: user._id }).toArray();
  if (habits.length === 0) {
    return ctx.answerCbQuery('No habits found');
  }

  setSelectedHabit(telegramId, habitId);
  const message = await buildStatsMessage(user._id, telegramId, habits, habitId);
  const keyboard = getNavigationKeyboard(telegramId);

  await safeEditMessageText(ctx, message, keyboard);
  await ctx.answerCbQuery();
}
