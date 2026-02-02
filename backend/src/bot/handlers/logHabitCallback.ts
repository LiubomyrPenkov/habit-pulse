import { Context } from 'telegraf';
import { ObjectId } from 'mongodb';
import { database } from '../../database';

// Store habit selection for date input
const pendingHabitLog = new Map<number, string>();

export function setPendingHabitLog(telegramId: number, habitId: string) {
  pendingHabitLog.set(telegramId, habitId);
}

export function getPendingHabitLog(telegramId: number): string | undefined {
  return pendingHabitLog.get(telegramId);
}

export function clearPendingHabitLog(telegramId: number) {
  pendingHabitLog.delete(telegramId);
}

export async function handleLogHabitCallback(ctx: Context) {
  const callbackData = (ctx.callbackQuery as any)?.data;

  if (!callbackData || !callbackData.startsWith('log_')) {
    return;
  }

  const habitId = callbackData.replace('log_', '');
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    return ctx.answerCbQuery('Unable to identify user.');
  }

  const user = await database.users.findOne({ telegramId });

  if (!user || !user._id) {
    return ctx.answerCbQuery('User not found.');
  }

  try {
    const habit = await database.habits.findOne({
      _id: new ObjectId(habitId),
      userId: user._id,
    });

    if (!habit) {
      return ctx.answerCbQuery('Habit not found.');
    }

    // Store habit selection and show date options
    setPendingHabitLog(telegramId, habitId);

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📅 Today',
            callback_data: `logdate_today_${habitId}`,
          },
          {
            text: '📆 Custom Date',
            callback_data: `logdate_custom_${habitId}`,
          },
        ],
      ],
    };

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `📊 <b>${habit.name}</b>\n\nWhen do you want to log this habit?`,
      {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    console.error('Error in habit selection:', error);
    await ctx.answerCbQuery('Error selecting habit.');
  }
}

export async function handleLogDateCallback(ctx: Context) {
  const callbackData = (ctx.callbackQuery as any)?.data;
  const telegramId = ctx.from?.id;

  if (!callbackData || !telegramId) {
    return ctx.answerCbQuery('Error');
  }

  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.answerCbQuery('User not found');
  }

  const parts = callbackData.split('_');
  const dateType = parts[1]; // 'today' or 'custom'
  const habitId = parts[2];

  try {
    const habit = await database.habits.findOne({
      _id: new ObjectId(habitId),
      userId: user._id,
    });

    if (!habit) {
      return ctx.answerCbQuery('Habit not found.');
    }

    if (dateType === 'today') {
      // Log for today
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingLog = await database.dailyLogs.findOne({
        habitId: habit._id,
        userId: user._id,
        timestamp: {
          $gte: today,
          $lt: tomorrow,
        },
      });

      if (existingLog) {
            await ctx.answerCbQuery('Already logged today.');
        return ctx.editMessageText(
              `⚠️ "${habit.name}" was already logged today.\n\nUse /log_habit to log another habit.`
        );
      }

      await database.dailyLogs.insertOne({
        habitId: habit._id!,
        userId: user._id,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      clearPendingHabitLog(telegramId);

      await ctx.answerCbQuery('Logged successfully! 🎉');
      await ctx.editMessageText(
        `✅ Logged "${habit.name}" for today!\n\nGreat job staying consistent! 💪\n\nUse /log_habit to log another habit or /stats to see your progress.`
      );
    } else if (dateType === 'custom') {
      // Ask for custom date
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        `📅 Enter the date for <b>${habit.name}</b>\n\nFormat: DD.MM.YYYY (e.g., 01.02.2026)\n\nOr send "cancel" to go back.`,
        { parse_mode: 'HTML' }
      );
    }
  } catch (error) {
    console.error('Error logging habit:', error);
    await ctx.answerCbQuery('Error logging habit.');
  }
}
