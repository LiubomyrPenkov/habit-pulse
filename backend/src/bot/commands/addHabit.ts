import { Context } from 'telegraf';
import { database } from '../../database';

const awaitingHabitName = new Set<number>();
const awaitingTargetMonth = new Map<number, string>(); // telegramId -> habitName
const awaitingTargetYear = new Map<number, { name: string; targetPerMonth?: number }>();

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function markAwaitingHabitName(telegramId: number) {
  awaitingHabitName.add(telegramId);
}

export function clearAwaitingHabitName(telegramId: number) {
  awaitingHabitName.delete(telegramId);
}

export function isAwaitingHabitName(telegramId: number) {
  return awaitingHabitName.has(telegramId);
}

export function isAwaitingTargetMonth(telegramId: number) {
  return awaitingTargetMonth.has(telegramId);
}

export function isAwaitingTargetYear(telegramId: number) {
  return awaitingTargetYear.has(telegramId);
}

export async function addHabitCommand(ctx: Context) {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    return ctx.reply('Unable to identify user.');
  }

  const user = await database.users.findOne({ telegramId });

  if (!user) {
    return ctx.reply('Please use /start first to register.');
  }

  await ctx.reply('Please enter the name of the habit you want to track:');

  // Set up a listener for the next message
  markAwaitingHabitName(telegramId);
}

export async function handleHabitNameInput(ctx: Context) {
  const telegramId = ctx.from?.id;
  const message = ctx.message as { text?: string } | undefined;
  const rawHabitName = message?.text?.trim();

  if (!telegramId || !rawHabitName) {
    return;
  }

  const habitName = capitalizeFirstLetter(rawHabitName);

  const user = await database.users.findOne({ telegramId });

  if (!user || !user._id) {
    return ctx.reply('Please use /start first to register.');
  }

  // Check if habit already exists (case-insensitive)
  const existingHabit = await database.habits.findOne({
    userId: user._id,
    name: habitName,
  });

  if (existingHabit) {
    clearAwaitingHabitName(telegramId);
    return ctx.reply(`You already have a habit named "${habitName}". Please choose a different name.`);
  }

  // Clear habit name awaiting and ask for monthly target
  clearAwaitingHabitName(telegramId);
  awaitingTargetMonth.set(telegramId, habitName);

  await ctx.reply(
    `Great! Now set a monthly target for "${habitName}".\n\nHow many times per month do you want to do this habit?\n\nSend a number (e.g., 20) or "skip" to set no target.`
  );
}

export async function handleTargetMonthInput(ctx: Context) {
  const telegramId = ctx.from?.id;
  const message = ctx.message as { text?: string } | undefined;
  const input = message?.text?.trim().toLowerCase();

  if (!telegramId || !input) {
    return;
  }

  const habitName = awaitingTargetMonth.get(telegramId);
  if (!habitName) {
    return;
  }

  let targetPerMonth: number | undefined;

  if (input === 'skip') {
    targetPerMonth = undefined;
  } else {
    const target = parseInt(input);
    if (isNaN(target) || target <= 0) {
      return ctx.reply('Please enter a valid positive number or "skip".');
    }
    targetPerMonth = target;
  }

  // Clear monthly target awaiting and ask for yearly target
  awaitingTargetMonth.delete(telegramId);
  awaitingTargetYear.set(telegramId, { name: habitName, targetPerMonth });

  await ctx.reply(
    `Now set a yearly target for "${habitName}".\n\nHow many times per year do you want to do this habit?\n\nSend a number (e.g., 200) or "skip" to set no target.`
  );
}

export async function handleTargetYearInput(ctx: Context) {
  const telegramId = ctx.from?.id;
  const message = ctx.message as { text?: string } | undefined;
  const input = message?.text?.trim().toLowerCase();

  if (!telegramId || !input) {
    return;
  }

  const habitData = awaitingTargetYear.get(telegramId);
  if (!habitData) {
    return;
  }

  const user = await database.users.findOne({ telegramId });
  if (!user || !user._id) {
    return ctx.reply('Please use /start first to register.');
  }

  let targetPerYear: number | undefined;

  if (input === 'skip') {
    targetPerYear = undefined;
  } else {
    const target = parseInt(input);
    if (isNaN(target) || target <= 0) {
      return ctx.reply('Please enter a valid positive number or "skip".');
    }
    targetPerYear = target;
  }

  // Create new habit with targets
  await database.habits.insertOne({
    userId: user._id,
    name: habitData.name,
    enabled: true,
    targetPerMonth: habitData.targetPerMonth,
    targetPerYear: targetPerYear,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Clear the awaiting flag
  awaitingTargetYear.delete(telegramId);

  let targetMsg = '';
  if (habitData.targetPerMonth) {
    targetMsg += `\n📊 Monthly target: ${habitData.targetPerMonth}`;
  }
  if (targetPerYear) {
    targetMsg += `\n📊 Yearly target: ${targetPerYear}`;
  }

  await ctx.reply(
    `✅ Habit "${habitData.name}" created successfully!${targetMsg}\n\nYou can now log it with /log_habit`
  );
}
