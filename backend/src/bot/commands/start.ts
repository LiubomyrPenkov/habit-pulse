import { Context } from 'telegraf';
import { database } from '../../database';
import { config } from '../../config';
import { getStartWelcome, getStartKeyboard, getUnableToIdentifyUser, getLocale, getSpecialDisplayName } from '../i18n';

export async function startCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  const firstName = ctx.from?.first_name || 'User';
  const lastName = ctx.from?.last_name;
  const username = ctx.from?.username;

  const displayName = username === 'darvolu' ? getSpecialDisplayName(ctx) : firstName;

  if (!telegramId) {
    return ctx.reply(getUnableToIdentifyUser(ctx));
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

  const welcomeMessage = getStartWelcome(ctx, displayName);
  const keyboard = getStartKeyboard(getLocale(ctx));

  try {
    const result = await ctx.reply(welcomeMessage, {
      reply_markup: keyboard,
    });
    console.log('✅ /start reply sent:', result?.message_id);
  } catch (error) {
    console.error('❌ /start reply failed:', error);
  }
}
