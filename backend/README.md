# Habit Pulse Telegram Bot - Backend

Node.js/TypeScript backend for the Telegram Habit Pulse bot with webhook support, MongoDB persistence, and REST API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
   - `BOT_TOKEN`: Get from [@BotFather](https://t.me/BotFather) on Telegram
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `WEBHOOK_URL`: Your production domain (for webhooks)
   - `WEBHOOK_SECRET`: Random secret token for webhook security
   - `FRONTEND_URL`: Your Angular frontend URL (for CORS)

4. Run in development mode:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── bot/            # Telegram bot handlers and commands
│   ├── api/            # REST API endpoints
│   ├── database/       # MongoDB connection and operations
│   ├── services/       # Business logic (reminders, stats)
│   ├── types/          # TypeScript interfaces
│   ├── config/         # Configuration
│   └── index.ts        # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Deployment

### MongoDB Atlas
1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user and whitelist IP (0.0.0.0/0 for development)
3. Copy connection string to `.env`

### Backend Hosting (Choose one)

#### Railway.app
1. Sign up at [Railway](https://railway.app/)
2. Create new project from GitHub repo
3. Add environment variables
4. Deploy

#### Render
1. Sign up at [Render](https://render.com/)
2. Create new Web Service
3. Connect GitHub repo
4. Add environment variables
5. Deploy

#### Fly.io
1. Install flyctl: `brew install flyctl`
2. Sign up: `flyctl auth signup`
3. Launch app: `flyctl launch`
4. Set secrets: `flyctl secrets set BOT_TOKEN=xxx`
5. Deploy: `flyctl deploy`

## Development

- `npm run dev` - Start with hot reload
- `npm run build` - Build TypeScript
- `npm run type-check` - Check types without building

### Local development with a separate dev bot (recommended)

Use a **second bot** for local development so the production bot and webhook are never touched.

1. **Create a dev bot in Telegram**
   - Open [@BotFather](https://t.me/BotFather)
   - Send `/newbot` and follow the prompts (e.g. name: "Habit Pulse Dev", username: "YourBotName_dev_bot")
   - Copy the **dev** bot token

2. **Use the dev token only in your local `.env`**
   - In `backend/.env`, set `BOT_TOKEN` to the **dev** bot token (not the production one)
   - Leave `WEBHOOK_URL` empty or omit it so the app uses polling locally
   - Keep `NODE_ENV=development`

3. **Run locally**
   ```bash
   npm run dev
   ```
   You’ll see "Running in polling mode (development)". All messages to the **dev** bot go to your local app.

4. **Production stays unchanged**
   - Deployed app keeps using the **production** `BOT_TOKEN` and `WEBHOOK_URL` in its environment
   - No need to redeploy or reset the webhook after local testing
