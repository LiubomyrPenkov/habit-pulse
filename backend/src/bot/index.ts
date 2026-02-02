import { Telegraf } from 'telegraf';
import { config } from '../config';
import { startCommand } from './commands/start';
import {
  addHabitCommand,
  handleHabitNameInput,
  handleTargetMonthInput,
  handleTargetYearInput,
  isAwaitingHabitName,
  isAwaitingTargetMonth,
  isAwaitingTargetYear,
} from './commands/addHabit';
import { viewHabitsCommand, handleViewHabitCallback, handleSetTargetCallback, isAwaitingMonthTargetUpdate, isAwaitingYearTargetUpdate, handleMonthTargetUpdate, handleYearTargetUpdate, handleRemoveHabitCallback } from './commands/viewHabits';
import { logHabitCommand } from './commands/logHabit';
import { statsCommand, handleStatsNavigation, handleViewHabitStats } from './commands/stats';
import { handleLogHabitCallback, handleLogDateCallback, getPendingHabitLog } from './handlers/logHabitCallback';
import { handleLogHabitText, isAwaitingHabitLog } from './handlers/logHabitText';
import { handleCustomDateInput } from './handlers/logCustomDate';
import { testReminderCommand } from './commands/testReminder';

const lastCallbackByUser = new Map<number, { data: string; at: number }>();

export function createBot() {
  const bot = new Telegraf(config.bot.token);

  // Log all incoming updates for debugging
  bot.use(async (ctx, next) => {
    const updateType = (ctx.updateType || 'unknown');
    const fromId = ctx.from?.id;
    const text = (ctx.message as any)?.text;
    console.log(`[update] type=${updateType} from=${fromId} text=${text ?? ''}`);
    return next();
  });

  // Commands
  bot.command('start', startCommand);
  bot.command('add_habit', addHabitCommand);
  bot.command('view_habits', viewHabitsCommand);
  bot.command('log_habit', logHabitCommand);
  bot.command('stats', statsCommand);
  bot.command('test_reminder', async (ctx) => {
    await testReminderCommand(ctx, bot);
  });

  // Callback query handlers
  bot.on('callback_query', async (ctx) => {
    const data = (ctx.callbackQuery as any)?.data;
    const updateId = (ctx.update as any)?.update_id;
    console.log(`[callback] update_id=${updateId} data=${data ?? ''}`);
    if (data?.startsWith('log_')) {
      await handleLogHabitCallback(ctx);
    } else if (data?.startsWith('logdate_')) {
      await handleLogDateCallback(ctx);
    } else if (data?.startsWith('view_habit_')) {
      await handleViewHabitCallback(ctx);
    } else if (data?.startsWith('set_month_target_') || data?.startsWith('set_year_target_')) {
      const telegramId = ctx.from?.id;
      if (telegramId && data) {
        const last = lastCallbackByUser.get(telegramId);
        const now = Date.now();
        if (last && last.data === data && now - last.at < 1000) {
          await ctx.answerCbQuery();
          return;
        }
        lastCallbackByUser.set(telegramId, { data, at: now });
      }
      await handleSetTargetCallback(ctx);
    } else if (data?.startsWith('remove_habit_')) {
      await handleRemoveHabitCallback(ctx);
    } else if (data?.startsWith('view_stats_')) {
      await handleViewHabitStats(ctx);
    } else if (data?.startsWith('stats_')) {
      await handleStatsNavigation(ctx);
    }
  });

  // Handle text messages (for habit name input or habit logging)
  bot.on('text', async (ctx, next) => {
    const telegramId = ctx.from?.id;
    if (telegramId && isAwaitingHabitName(telegramId)) {
      await handleHabitNameInput(ctx);
    } else if (telegramId && isAwaitingTargetMonth(telegramId)) {
      await handleTargetMonthInput(ctx);
    } else if (telegramId && isAwaitingTargetYear(telegramId)) {
      await handleTargetYearInput(ctx);
    } else if (telegramId && isAwaitingMonthTargetUpdate(telegramId)) {
      await handleMonthTargetUpdate(ctx);
    } else if (telegramId && isAwaitingYearTargetUpdate(telegramId)) {
      await handleYearTargetUpdate(ctx);
    } else if (telegramId && isAwaitingHabitLog(telegramId)) {
      await handleLogHabitText(ctx);
    } else if (telegramId && getPendingHabitLog(telegramId)) {
      await handleCustomDateInput(ctx);
    } else {
      await next();
    }
  });

  // Error handling
  bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('Sorry, an error occurred. Please try again later.');
  });

  return bot;
}
