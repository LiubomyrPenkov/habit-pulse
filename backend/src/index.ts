import express, { Request, Response } from 'express';
import cors from 'cors';
import { Telegraf } from 'telegraf';
import { config } from './config';
import { database } from './database';
import { createBot } from './bot';
import { startReminderScheduler } from './services/reminderScheduler';
import apiRouter from './api';

async function main() {
  try {
    // Connect to MongoDB
    await database.connect();

    // Create Express app
    const app = express();

    // Middleware
    app.use(express.json());
    app.use(
      cors({
        origin: config.frontend.url,
        credentials: true,
      })
    );

    // Health check endpoint
    app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API routes
    app.use('/api', apiRouter);

    // Create bot
    const bot = createBot();

    // Webhook endpoint
    app.post(`/webhook/${config.bot.webhookSecret}`, (req: Request, res: Response) => {
      bot.handleUpdate(req.body, res);
    });

    // Start reminder scheduler
    startReminderScheduler(bot);

    // Start server
    const PORT = config.server.port;
    app.listen(PORT, async () => {
      console.log(`🚀 Server running on port ${PORT}`);

      // Set up webhook or polling based on environment
      if (config.server.nodeEnv === 'production' && config.bot.webhookUrl) {
        const webhookUrl = `${config.bot.webhookUrl}/${config.bot.webhookSecret}`;
        await bot.telegram.setWebhook(webhookUrl);
        console.log(`✅ Webhook set to: ${webhookUrl}`);
      } else {
        // Use polling for development
        console.log('⚠️  Running in polling mode (development)');
        await bot.telegram.deleteWebhook();
        bot.launch();
      }
    });

    // Graceful shutdown
    process.once('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully...');
      bot.stop('SIGINT');
      database.disconnect();
      process.exit(0);
    });

    process.once('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      bot.stop('SIGTERM');
      database.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

main();
