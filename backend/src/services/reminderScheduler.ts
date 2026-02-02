import schedule from 'node-schedule';
import { Telegraf } from 'telegraf';
import { database } from '../database';
import { config } from '../config';

export function startReminderScheduler(bot: Telegraf) {
  // Schedule job to run daily at the configured hour (9 AM UTC by default)
  const cronExpression = `0 ${config.reminder.hour} * * *`;

  schedule.scheduleJob(cronExpression, async () => {
    console.log('Running daily reminder job...');

    try {
      // Get all users
      const users = await database.users.find({}).toArray();

      for (const user of users) {
        if (!user._id) continue;

        // Get user's enabled habits
        const habits = await database.habits
          .find({
            userId: user._id,
            enabled: true,
          })
          .toArray();

        if (habits.length === 0) {
          continue; // Skip users with no enabled habits
        }

        // Build reminder message
        let message = '⏰ Daily Reminder!\n\n';
        message += 'Don\'t forget to log your habits today:\n\n';

        habits.forEach((habit, index) => {
          message += `${index + 1}. ${habit.name}\n`;
        });

        message += '\nUse /log_habit to track your progress! 💪';

        // Send reminder to user
        try {
          await bot.telegram.sendMessage(user.telegramId, message);
          console.log(`Reminder sent to user ${user.telegramId}`);
        } catch (error) {
          console.error(`Failed to send reminder to user ${user.telegramId}:`, error);
        }
      }

      console.log('Daily reminder job completed');
    } catch (error) {
      console.error('Error in reminder scheduler:', error);
    }
  });

  console.log(`✅ Reminder scheduler started (runs daily at ${config.reminder.hour}:00 UTC)`);
}
