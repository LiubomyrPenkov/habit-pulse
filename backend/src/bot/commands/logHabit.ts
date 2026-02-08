import { Context } from 'telegraf';
import { database } from '../../database';
import { getMessage, getUnableToIdentifyUser, getPleaseUseStartFirst } from '../i18n';

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function logHabitCommand(ctx: Context) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    return ctx.reply(getUnableToIdentifyUser(ctx));
  }

  const user = await database.users.findOne({ telegramId });

  if (!user || !user._id) {
    return ctx.reply(getPleaseUseStartFirst(ctx));
  }

  // Get enabled habits
  const habits = await database.habits.find({
    userId: user._id,
    enabled: true,
  }).toArray();

  if (habits.length === 0) {
    return ctx.reply(getMessage(ctx, 'logHabit_noActiveHabits'));
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

  await ctx.reply(getMessage(ctx, 'logHabit_selectToLog'), {
    reply_markup: keyboard,
  });
}
