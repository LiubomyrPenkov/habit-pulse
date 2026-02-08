import { Context } from 'telegraf';
import { database } from '../../database';
import { getMessage, getUnableToIdentifyUser, getPleaseUseStartFirst, getUserNotFound, getHabitNotFound, getCommonError } from '../i18n';

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
    return ctx.reply(getUnableToIdentifyUser(ctx));
  }

  const user = await database.users.findOne({ telegramId });

  if (!user || !user._id) {
    return ctx.reply(getPleaseUseStartFirst(ctx));
  }

  const habits = await database.habits.find({ userId: user._id }).toArray();

  if (habits.length === 0) {
    return ctx.reply(getMessage(ctx, 'viewHabits_noHabitsYet'));
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

  await ctx.reply(getMessage(ctx, 'viewHabits_selectToViewDetails'), {
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
    return ctx.answerCbQuery(getUserNotFound(ctx));
  }

  const habit = await database.habits.findOne({
    _id: database.parseObjectId(habitId),
    userId: user._id,
  });

  if (!habit) {
    return ctx.answerCbQuery(getHabitNotFound(ctx));
  }

  // Get last log
  const lastLog = await database.dailyLogs
    .findOne(
      { habitId: habit._id, userId: user._id },
      { sort: { timestamp: -1 } }
    );

  const createdDate = formatDate(habit.createdAt);
  const lastLogDate = lastLog ? formatDate(lastLog.timestamp) : getMessage(ctx, 'viewHabits_never');
  const targetPerMonth = habit.targetPerMonth ?? getMessage(ctx, 'viewHabits_notSet');
  const targetPerYear = habit.targetPerYear ?? getMessage(ctx, 'viewHabits_notSet');

  let message = `<b>${capitalizeFirstLetter(habit.name)}</b>\n\n`;
  message += `${getMessage(ctx, 'viewHabits_created')} ${createdDate}\n`;
  message += `${getMessage(ctx, 'viewHabits_lastLogged')} ${lastLogDate}\n\n`;
  message += `<b>${getMessage(ctx, 'viewHabits_targets')}</b>\n`;
  message += `${getMessage(ctx, 'viewHabits_perMonth')} ${targetPerMonth}\n`;
  message += `${getMessage(ctx, 'viewHabits_perYear')} ${targetPerYear}\n`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: getMessage(ctx, 'viewHabits_viewStats'), callback_data: `view_stats_${telegramId}_${habitId}` },
      ],
      [
        { text: getMessage(ctx, 'viewHabits_setMonthlyTargetBtn'), callback_data: `set_month_target_${telegramId}_${habitId}` },
        { text: getMessage(ctx, 'viewHabits_setYearlyTargetBtn'), callback_data: `set_year_target_${telegramId}_${habitId}` },
      ],
      [
        { text: getMessage(ctx, 'viewHabits_removeHabit'), callback_data: `remove_habit_${telegramId}_${habitId}` },
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
    return ctx.answerCbQuery(getCommonError(ctx));
  }

  const parts = callbackData.split('_');
  const targetType = parts[1]; // 'month' or 'year'
  const habitId = parts[4];

  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.answerCbQuery(getUserNotFound(ctx));
  }

  const habit = await database.habits.findOne({
    _id: database.parseObjectId(habitId),
    userId: user._id,
  });

  if (!habit) {
    return ctx.answerCbQuery(getHabitNotFound(ctx));
  }

  if (targetType === 'month') {
    awaitingMonthTargetUpdate.set(telegramId, habitId);
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getMessage(ctx, 'viewHabits_setMonthlyTargetFor', { habitName: capitalizeFirstLetter(habit.name) }),
      { parse_mode: 'HTML' }
    );
  } else if (targetType === 'year') {
    awaitingYearTargetUpdate.set(telegramId, habitId);
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getMessage(ctx, 'viewHabits_setYearlyTargetFor', { habitName: capitalizeFirstLetter(habit.name) }),
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
    return ctx.reply(getUserNotFound(ctx));
  }

  const target = parseInt(input);
  if (isNaN(target) || target < 0) {
    return ctx.reply(getMessage(ctx, 'viewHabits_validNumberZeroOrHigher'));
  }

  const habit = await database.habits.findOne({
    _id: database.parseObjectId(habitId),
    userId: user._id,
  });

  if (!habit) {
    awaitingMonthTargetUpdate.delete(telegramId);
    return ctx.reply(getHabitNotFound(ctx));
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

  const targetMsg = target === 0 ? getMessage(ctx, 'viewHabits_targetRemoved') : getMessage(ctx, 'viewHabits_targetSetTo', { n: target });
  await ctx.reply(
    getMessage(ctx, 'viewHabits_monthlyTargetUpdated', { habitName: capitalizeFirstLetter(habit.name), targetMsg })
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
    return ctx.reply(getUserNotFound(ctx));
  }

  const target = parseInt(input);
  if (isNaN(target) || target < 0) {
    return ctx.reply(getMessage(ctx, 'viewHabits_validNumberZeroOrHigher'));
  }

  const habit = await database.habits.findOne({
    _id: database.parseObjectId(habitId),
    userId: user._id,
  });

  if (!habit) {
    awaitingYearTargetUpdate.delete(telegramId);
    return ctx.reply(getHabitNotFound(ctx));
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

  const targetMsg = target === 0 ? getMessage(ctx, 'viewHabits_targetRemoved') : getMessage(ctx, 'viewHabits_targetSetTo', { n: target });
  await ctx.reply(
    getMessage(ctx, 'viewHabits_yearlyTargetUpdated', { habitName: capitalizeFirstLetter(habit.name), targetMsg })
  );
}

export async function handleRemoveHabitCallback(ctx: Context) {
  const callbackData = (ctx.callbackQuery as any)?.data;
  const telegramId = ctx.from?.id;

  if (!callbackData || !telegramId) {
    return ctx.answerCbQuery(getCommonError(ctx));
  }

  const parts = callbackData.split('_');
  const habitId = parts[3];

  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.answerCbQuery(getUserNotFound(ctx));
  }

  const habit = await database.habits.findOne({
    _id: database.parseObjectId(habitId),
    userId: user._id,
  });

  if (!habit) {
    return ctx.answerCbQuery(getHabitNotFound(ctx));
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
    getMessage(ctx, 'viewHabits_habitRemoved', { habitName: capitalizeFirstLetter(habit.name) })
  );
}
