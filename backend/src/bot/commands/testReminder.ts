import { Context, Telegraf } from 'telegraf';
import { database } from '../../database';

export async function testReminderCommand(ctx: Context, bot: Telegraf) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    return ctx.reply('Unable to identify user.');
  }

  const user = await database.users.findOne({ telegramId });

  if (!user || !user._id) {
    return ctx.reply('Please use /start first to register.');
  }

  try {
    // Get user's enabled habits
    const habits = await database.habits
      .find({
        userId: user._id,
        enabled: true,
      })
      .toArray();

    if (habits.length === 0) {
      return ctx.reply('You don\'t have any enabled habits to test with.');
    }

    // Build test reminder message
    let message = '⏰ Test Daily Reminder!\n\n';
    message += 'This is a test notification. Your habits are:\n\n';

    habits.forEach((habit, index) => {
      message += `${index + 1}. ${habit.name}\n`;
    });

    message += '\nUse /log_habit to track your progress! 💪';

    // Send test reminder
    await bot.telegram.sendMessage(telegramId, message);
    await ctx.reply('✅ Test reminder sent!');
  } catch (error) {
    console.error('Error sending test reminder:', error);
    await ctx.reply('❌ Failed to send test reminder.');
  }
}
