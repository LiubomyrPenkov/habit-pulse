import { Context } from 'telegraf';
import { ObjectId } from 'mongodb';
import { database } from '../../database';

const awaitingHabitLog = new Set<number>();

export function markAwaitingHabitLog(telegramId: number) {
  awaitingHabitLog.add(telegramId);
}

export function clearAwaitingHabitLog(telegramId: number) {
  awaitingHabitLog.delete(telegramId);
}

export function isAwaitingHabitLog(telegramId: number) {
  return awaitingHabitLog.has(telegramId);
}

export async function handleLogHabitText(ctx: Context) {
  const telegramId = ctx.from?.id;
  const habitName = (ctx.message as { text?: string } | undefined)?.text?.trim();

  if (!telegramId || !habitName) {
    return;
  }

  const user = await database.users.findOne({ telegramId });

  if (!user || !user._id) {
    await ctx.reply('User not found.');
    clearAwaitingHabitLog(telegramId);
    return;
  }

  try {
    // Find habit by name
    const habit = await database.habits.findOne({
      userId: user._id,
      name: habitName,
      enabled: true,
    });

    if (!habit) {
      await ctx.reply(`Habit "${habitName}" not found.`);
      clearAwaitingHabitLog(telegramId);
      return;
    }

    // Check if already logged today
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
          await ctx.reply(`⚠️ "${habitName}" was already logged today.`);
      clearAwaitingHabitLog(telegramId);
      return;
    }

    // Create log entry
    await database.dailyLogs.insertOne({
      habitId: habit._id,
      userId: user._id,
      timestamp: new Date(),
      createdAt: new Date(),
    });

    await ctx.reply(
      `✅ Logged "${habitName}" for today!\n\nGreat job staying consistent! 💪\n\nUse /log_habit to log another habit or /stats to see your progress.`
    );

    clearAwaitingHabitLog(telegramId);
  } catch (error) {
    console.error('Error logging habit:', error);
    await ctx.reply('Error logging habit.');
    clearAwaitingHabitLog(telegramId);
  }
}
