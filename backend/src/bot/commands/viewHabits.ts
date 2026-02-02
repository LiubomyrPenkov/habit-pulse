import { Context } from 'telegraf';
import { database } from '../../database';

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatDate(date: Date): string {
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

// Store pending target updates
const awaitingMonthTargetUpdate = new Map<number, string>(); // telegramId -> habitId
const awaitingYearTargetUpdate = new Map<number, string>(); // telegramId -> habitId

export function isAwaitingMonthTargetUpdate(telegramId: number): boolean {
  return awaitingMonthTargetUpdate.has(telegramId);
}

export function isAwaitingYearTargetUpdate(telegramId: number): boolean {
  return awaitingYearTargetUpdate.has(telegramId);
}

export async function viewHabitsCommand(ctx: Context) {
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

  // Create buttons for each habit
  const buttons = habits.map(habit => [
    {
      text: capitalizeFirstLetter(habit.name),
      callback_data: `view_habit_${telegramId}_${habit._id}`,
    },
  ]);

  const keyboard = {
    inline_keyboard: buttons,
  };

  await ctx.reply('📋 Select a habit to view details:', {
    reply_markup: keyboard,
  });
}

export async function handleViewHabitCallback(ctx: Context) {
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

  const habit = await database.habits.findOne({
    _id: database.parseObjectId(habitId),
    userId: user._id,
  });

  if (!habit) {
    return ctx.answerCbQuery('Habit not found');
  }

  // Get last log
  const lastLog = await database.dailyLogs
    .findOne(
      { habitId: habit._id, userId: user._id },
      { sort: { timestamp: -1 } }
    );

  const createdDate = formatDate(habit.createdAt);
  const lastLogDate = lastLog ? formatDate(lastLog.timestamp) : 'Never';

  const targetPerMonth = habit.targetPerMonth || 'Not set';
  const targetPerYear = habit.targetPerYear || 'Not set';

  let message = `<b>${capitalizeFirstLetter(habit.name)}</b>\n\n`;
  message += `Created: ${createdDate}\n`;
  message += `Last logged: ${lastLogDate}\n\n`;
  message += `<b>Targets:</b>\n`;
  message += `Per month: ${targetPerMonth}\n`;
  message += `Per year: ${targetPerYear}\n`;
  

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '📊 View Stats',
          callback_data: `view_stats_${telegramId}_${habitId}`,
        },
      ],
      [
        {
          text: '📊 Set Monthly Target',
          callback_data: `set_month_target_${telegramId}_${habitId}`,
        },
        {
          text: '📈 Set Yearly Target',
          callback_data: `set_year_target_${telegramId}_${habitId}`,
        },
      ],
      [
        {
          text: '🗑 Remove Habit',
          callback_data: `remove_habit_${telegramId}_${habitId}`,
        },
      ],
    ],
  };

  await ctx.answerCbQuery();
  await ctx.editMessageText(message, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
}

export async function handleSetTargetCallback(ctx: Context) {
  const callbackData = (ctx.callbackQuery as any)?.data;
  const telegramId = ctx.from?.id;

  if (!callbackData || !telegramId) {
    return ctx.answerCbQuery('Error');
  }

  const parts = callbackData.split('_');
  const targetType = parts[1]; // 'month' or 'year'
  const habitId = parts[4];

  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.answerCbQuery('User not found');
  }

  const habit = await database.habits.findOne({
    _id: database.parseObjectId(habitId),
    userId: user._id,
  });

  if (!habit) {
    return ctx.answerCbQuery('Habit not found');
  }

  if (targetType === 'month') {
    awaitingMonthTargetUpdate.set(telegramId, habitId);
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `Set monthly target for <b>${capitalizeFirstLetter(habit.name)}</b>\n\nHow many times per month?\n\nSend a number or "0" to remove the target.`,
      { parse_mode: 'HTML' }
    );
  } else if (targetType === 'year') {
    awaitingYearTargetUpdate.set(telegramId, habitId);
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `Set yearly target for <b>${capitalizeFirstLetter(habit.name)}</b>\n\nHow many times per year?\n\nSend a number or "0" to remove the target.`,
      { parse_mode: 'HTML' }
    );
  }
}

export async function handleMonthTargetUpdate(ctx: Context) {
  const telegramId = ctx.from?.id;
  const message = ctx.message as { text?: string } | undefined;
  const input = message?.text?.trim();

  if (!telegramId || !input) {
    return;
  }

  const habitId = awaitingMonthTargetUpdate.get(telegramId);
  if (!habitId) {
    return;
  }

  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.reply('User not found.');
  }

  const target = parseInt(input);
  if (isNaN(target) || target < 0) {
    return ctx.reply('Please enter a valid number (0 or higher).');
  }

  const habit = await database.habits.findOne({
    _id: database.parseObjectId(habitId),
    userId: user._id,
  });

  if (!habit) {
    awaitingMonthTargetUpdate.delete(telegramId);
    return ctx.reply('Habit not found.');
  }

  // Update habit
  await database.habits.updateOne(
    { _id: database.parseObjectId(habitId) },
    {
      $set: {
        targetPerMonth: target === 0 ? undefined : target,
        updatedAt: new Date(),
      },
    }
  );

  awaitingMonthTargetUpdate.delete(telegramId);

  const targetMsg = target === 0 ? 'removed' : `set to ${target}`;
  await ctx.reply(
    `✅ Monthly target for "${capitalizeFirstLetter(habit.name)}" ${targetMsg}!\n\nUse /view_habits to see updated details.`
  );
}

export async function handleYearTargetUpdate(ctx: Context) {
  const telegramId = ctx.from?.id;
  const message = ctx.message as { text?: string } | undefined;
  const input = message?.text?.trim();

  if (!telegramId || !input) {
    return;
  }

  const habitId = awaitingYearTargetUpdate.get(telegramId);
  if (!habitId) {
    return;
  }

  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.reply('User not found.');
  }

  const target = parseInt(input);
  if (isNaN(target) || target < 0) {
    return ctx.reply('Please enter a valid number (0 or higher).');
  }

  const habit = await database.habits.findOne({
    _id: database.parseObjectId(habitId),
    userId: user._id,
  });

  if (!habit) {
    awaitingYearTargetUpdate.delete(telegramId);
    return ctx.reply('Habit not found.');
  }

  // Update habit
  await database.habits.updateOne(
    { _id: database.parseObjectId(habitId) },
    {
      $set: {
        targetPerYear: target === 0 ? undefined : target,
        updatedAt: new Date(),
      },
    }
  );

  awaitingYearTargetUpdate.delete(telegramId);

  const targetMsg = target === 0 ? 'removed' : `set to ${target}`;
  await ctx.reply(
    `✅ Yearly target for "${capitalizeFirstLetter(habit.name)}" ${targetMsg}!\n\nUse /view_habits to see updated details.`
  );
}

export async function handleRemoveHabitCallback(ctx: Context) {
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

  const habit = await database.habits.findOne({
    _id: database.parseObjectId(habitId),
    userId: user._id,
  });

  if (!habit) {
    return ctx.answerCbQuery('Habit not found');
  }

  await database.dailyLogs.deleteMany({ habitId: habit._id, userId: user._id });
  await database.habits.deleteOne({ _id: habit._id, userId: user._id });

  if (awaitingMonthTargetUpdate.get(telegramId) === habitId) {
    awaitingMonthTargetUpdate.delete(telegramId);
  }
  if (awaitingYearTargetUpdate.get(telegramId) === habitId) {
    awaitingYearTargetUpdate.delete(telegramId);
  }

  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `🗑 Habit "${capitalizeFirstLetter(habit.name)}" removed.\n\nUse /view_habits to see remaining habits.`
  );
}
