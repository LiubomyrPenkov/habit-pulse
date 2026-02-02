import { Context } from 'telegraf';
import { database } from '../../database';

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function logHabitCommand(ctx: Context) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    return ctx.reply('Unable to identify user.');
  }

  const user = await database.users.findOne({ telegramId });

  if (!user || !user._id) {
    return ctx.reply('Please use /start first to register.');
  }

  // Get enabled habits
  const habits = await database.habits.find({
    userId: user._id,
    enabled: true,
  }).toArray();

  if (habits.length === 0) {
    return ctx.reply('You don\'t have any active habits. Use /add_habit to create one!');
  }

  // Create inline keyboard with habit buttons
  const keyboard = {
    inline_keyboard: habits.map((habit) => [
      {
        text: capitalizeFirstLetter(habit.name),
        callback_data: `log_${habit._id?.toString()}`,
      },
    ]),
  };

  await ctx.reply('Select a habit to log:', {
    reply_markup: keyboard,
  });
}
