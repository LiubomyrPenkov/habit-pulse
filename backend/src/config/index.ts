import dotenv from 'dotenv';

dotenv.config();

export const config = {
  bot: {
    token: process.env.BOT_TOKEN || '',
    webhookUrl: process.env.WEBHOOK_URL || '',
    webhookSecret: process.env.WEBHOOK_SECRET || '',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:4200',
  },
  reminder: {
    hour: parseInt(process.env.REMINDER_TIME || '9', 10),
  },
};
