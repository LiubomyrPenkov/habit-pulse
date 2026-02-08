import { Context, Telegraf } from 'telegraf';
import { database } from '../../database';
import { getMessage, getUnableToIdentifyUser, getPleaseUseStartFirst } from '../i18n';

export async function testReminderCommand(ctx: Context, bot: Telegraf) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    return ctx.reply(getUnableToIdentifyUser(ctx));
  }

  const user = await database.users.findOne({ telegramId });

  if (!user || !user._id) {
    return ctx.reply(getPleaseUseStartFirst(ctx));
  }

  try {
    const habits = await database.habits
      .find({
        userId: user._id,
        enabled: true,
      })
      .toArray();

    if (habits.length === 0) {
      return ctx.reply(getMessage(ctx, 'testReminder_noEnabledHabits'));
    }

    let message = getMessage(ctx, 'testReminder_intro');
    habits.forEach((habit, index) => {
      message += `${index + 1}. ${habit.name}\n`;
    });
    message += getMessage(ctx, 'testReminder_useLogHabit');

    await bot.telegram.sendMessage(telegramId, message);
    await ctx.reply(getMessage(ctx, 'testReminder_sent'));
  } catch (error) {
    console.error('Error sending test reminder:', error);
    await ctx.reply(getMessage(ctx, 'testReminder_failed'));
  }
}
