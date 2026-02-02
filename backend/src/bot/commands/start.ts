import { Context } from 'telegraf';
import { database } from '../../database';
import { config } from '../../config';

export async function startCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  const firstName = ctx.from?.first_name || 'User';
  const lastName = ctx.from?.last_name;
  const username = ctx.from?.username;

  const displayName = username === 'darvolu' ? 'My beautiful princess ❤️' : firstName;
  console.log(displayName)
  if (!telegramId) {
    return ctx.reply('Unable to identify user.');
  }

  // Check if user exists, if not create
  let user = await database.users.findOne({ telegramId });

  if (!user) {
    await database.users.insertOne({
      telegramId,
      firstName,
      lastName,
      username,
      reminderTime: config.reminder.hour,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`New user created: ${telegramId} (${firstName})`);
  }

  const welcomeMessage = `👋 Welcome to Habit Pulse, ${displayName}!

I'll help you track your daily habits and stay consistent.

📝 Available commands:
/add_habit - Create a new habit
/view_habits - See all your habits
/log_habit - Log a habit for today
/stats - View your statistics

Let's build better habits together! 💪`;

  try {
    const result = await ctx.reply(welcomeMessage);
    console.log('✅ /start reply sent:', result?.message_id);
  } catch (error) {
    console.error('❌ /start reply failed:', error);
  }
}
