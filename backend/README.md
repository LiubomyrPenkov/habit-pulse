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
