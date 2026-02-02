import { Context } from 'telegraf';
import { ObjectId } from 'mongodb';
import { database } from '../../database';
import { getPendingHabitLog, clearPendingHabitLog } from './logHabitCallback';

export async function handleCustomDateInput(ctx: Context) {
  const telegramId = ctx.from?.id;
  const message = ctx.message as { text?: string } | undefined;
  const dateText = message?.text?.trim();

  if (!telegramId || !dateText) {
    return;
  }

  const habitId = getPendingHabitLog(telegramId);
  if (!habitId) {
    return; // No pending habit log
  }

  if (dateText.toLowerCase() === 'cancel') {
    clearPendingHabitLog(telegramId);
    return ctx.reply('Cancelled. Use /log_habit to try again.');
  }

  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.reply('User not found.');
  }

  try {
    const habit = await database.habits.findOne({
      _id: new ObjectId(habitId),
      userId: user._id,
    });

    if (!habit) {
      clearPendingHabitLog(telegramId);
      return ctx.reply('Habit not found.');
    }

    // Parse date in DD.MM.YYYY format
    const datePattern = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    const match = dateText.match(datePattern);

    if (!match) {
      return ctx.reply(
        'Invalid date format. Please use DD.MM.YYYY (e.g., 01.02.2026)\n\nOr send "cancel" to go back.'
      );
    }

    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // Month is 0-indexed
    const year = parseInt(match[3]);

    const logDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

    // Validate date
    if (
      isNaN(logDate.getTime()) ||
      logDate.getUTCDate() !== day ||
      logDate.getUTCMonth() !== month ||
      logDate.getUTCFullYear() !== year
    ) {
      return ctx.reply(
        'Invalid date. Please check and try again.\n\nFormat: DD.MM.YYYY (e.g., 01.02.2026)\n\nOr send "cancel" to go back.'
      );
    }

    // Check if date is not in the future
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);
    if (logDate > today) {
      return ctx.reply(
        'You cannot log for a future date. Please enter a date from today or earlier.\n\nOr send "cancel" to go back.'
      );
    }

    // Check if already logged for that date
    const nextDay = new Date(logDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingLog = await database.dailyLogs.findOne({
      habitId: habit._id,
      userId: user._id,
      timestamp: {
        $gte: logDate,
        $lt: nextDay,
      },
    });

    if (existingLog) {
      clearPendingHabitLog(telegramId);
        return ctx.reply(
          `⚠️ "${habit.name}" was already logged for ${dateText}.\n\nUse /log_habit to log another habit.`
        );
    }

    // Create log entry
    await database.dailyLogs.insertOne({
      habitId: habit._id!,
      userId: user._id,
      timestamp: logDate,
      createdAt: new Date(),
    });

    clearPendingHabitLog(telegramId);

    await ctx.reply(
      `✅ Logged "${habit.name}" for ${dateText}!\n\nGreat job staying consistent! 💪\n\nUse /log_habit to log another habit or /stats to see your progress.`
    );
  } catch (error) {
    console.error('Error logging habit with custom date:', error);
    clearPendingHabitLog(telegramId);
    await ctx.reply('Error logging habit. Please try again.');
  }
}
