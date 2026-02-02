# Habit Pulse - Telegram Bot

A full-stack Habit Pulse application with a Telegram bot interface and Angular web companion.

## Project Structure

```
t bot/
├── backend/          # Node.js/TypeScript backend
│   ├── src/
│   │   ├── api/      # REST API endpoints
│   │   ├── bot/      # Telegram bot commands and handlers
│   │   ├── config/   # Configuration
│   │   ├── database/ # MongoDB connection
│   │   ├── services/ # Business logic (reminders)
│   │   ├── types/    # TypeScript interfaces
│   │   └── index.ts  # Entry point
│   └── package.json
│
└── frontend/         # Angular web app
    └── src/
        ├── app/
        │   ├── models/   # Data models
        │   ├── pages/    # Login & Dashboard pages
        │   ├── services/ # API services
        │   └── ...
        └── ...
```

## Features

### Telegram Bot
- 🤖 `/start` - Register and get started
- ➕ `/add_habit` - Create a new habit
- 📋 `/view_habits` - See all your habits
- ✅ `/log_habit` - Log a habit (with inline buttons)
- 📊 `/stats` - View your statistics
- ⏰ Daily reminders at 9 AM UTC

### Web Companion
- 🔐 Login with Telegram ID
- 📝 Create, edit, and delete habits
- ✅ Log habits easily
- 📊 View statistics and progress
- 🎨 Responsive design

## Setup Instructions

### Prerequisites
- Node.js 20+ installed
- MongoDB Atlas account (free tier)
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
BOT_TOKEN=your_bot_token_from_botfather
WEBHOOK_URL=https://your-backend-url.com/webhook
WEBHOOK_SECRET=your_random_secret_token_here
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200
REMINDER_TIME=9
```

5. Run in development mode:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update backend API URL in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

4. Run development server:
```bash
npm start
```

5. Open browser at `http://localhost:4200`

### MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 tier)
3. Create database user:
   - Go to Database Access
   - Add New Database User
   - Choose password authentication
4. Whitelist IP:
   - Go to Network Access
   - Add IP Address
   - Use `0.0.0.0/0` (allow from anywhere) for development
5. Get connection string:
   - Go to Database → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database password
   - Add database name (e.g., `habit-tracker`)

### Get Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the token provided
5. Paste it in `.env` as `BOT_TOKEN`

## Deployment

### Backend Deployment (Railway.app - Recommended)

1. Sign up at [Railway.app](https://railway.app/)
2. Create new project from GitHub repo
3. Select backend folder as root
4. Add environment variables:
   - `BOT_TOKEN`
   - `WEBHOOK_URL` (will be `https://your-app.railway.app/webhook`)
   - `WEBHOOK_SECRET`
   - `MONGODB_URI`
   - `PORT` (Railway sets this automatically)
   - `NODE_ENV=production`
   - `FRONTEND_URL` (your frontend URL)
   - `REMINDER_TIME=9`
5. Deploy

### Alternative: Render.com

1. Sign up at [Render.com](https://render.com/)
2. Create new Web Service
3. Connect GitHub repository
4. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add environment variables (same as above)
6. Deploy

### Alternative: Fly.io

1. Install flyctl:
```bash
brew install flyctl  # macOS
```

2. Sign up and login:
```bash
flyctl auth signup
```

3. Navigate to backend and launch:
```bash
cd backend
flyctl launch
```

4. Set secrets:
```bash
flyctl secrets set BOT_TOKEN=your_token
flyctl secrets set MONGODB_URI=your_mongodb_uri
flyctl secrets set WEBHOOK_SECRET=your_secret
flyctl secrets set FRONTEND_URL=your_frontend_url
```

5. Deploy:
```bash
flyctl deploy
```

### Frontend Deployment (Vercel - Recommended)

1. Sign up at [Vercel](https://vercel.com/)
2. Import your GitHub repository
3. Configure:
   - Framework Preset: Angular
   - Root Directory: `frontend`
4. Update `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-url.com/api',
};
```
5. Deploy

### Alternative: Netlify

1. Sign up at [Netlify](https://netlify.com/)
2. Import repository
3. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist/frontend/browser`
4. Update production API URL
5. Deploy

## Usage

### Using the Telegram Bot

1. Find your bot in Telegram
2. Send `/start` to register
3. Use `/add_habit` to create habits
4. Use `/log_habit` to log daily progress
5. Use `/stats` to see your statistics
6. Receive daily reminders at 9 AM UTC

### Using the Web App

1. Open the web app URL
2. Find your Telegram ID:
   - Open Telegram
   - Search for [@userinfobot](https://t.me/userinfobot)
   - Start chat to get your ID
3. Enter your Telegram ID on login page
4. Manage habits and view stats in dashboard

## Tech Stack

### Backend
- Node.js & TypeScript
- Telegraf (Telegram bot framework)
- Express.js (REST API & webhooks)
- MongoDB (database)
- node-schedule (reminders)

### Frontend
- Angular 21
- TypeScript
- RxJS
- Standalone components

## API Endpoints

- `POST /api/auth/verify` - Verify Telegram ID
- `GET /api/habits?userId=xxx` - Get all habits
- `POST /api/habits` - Create habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/logs` - Log a habit
- `GET /api/logs/:habitId` - Get habit logs
- `GET /api/stats/:habitId` - Get habit stats
- `GET /api/stats/user/:userId` - Get all user stats

## Bot Commands

- `/start` - Register and start using the bot
- `/add_habit` - Create a new habit to track
- `/view_habits` - List all your habits
- `/log_habit` - Log a habit for today (inline buttons)
- `/stats` - View statistics for all habits

## Development

### Backend Development
```bash
cd backend
npm run dev  # Runs with tsx watch for hot reload
```

### Frontend Development
```bash
cd frontend
npm start  # Runs on http://localhost:4200
```

### Type Checking
```bash
npm run type-check  # Check TypeScript types
```

### Build for Production
```bash
npm run build  # Compiles TypeScript to dist/
```

## Environment Variables

### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token | `123456:ABC-DEF...` |
| `WEBHOOK_URL` | Base URL for webhooks | `https://myapp.com/webhook` |
| `WEBHOOK_SECRET` | Secret token for webhook security | `random_string_123` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | Frontend URL (for CORS) | `https://myapp.vercel.app` |
| `REMINDER_TIME` | Reminder hour (UTC) | `9` |

### Frontend
Update in `environment.prod.ts`:
- `apiUrl` - Backend API URL

## Troubleshooting

### Bot not responding
- Check `BOT_TOKEN` is correct
- Verify webhook is set correctly (production)
- Check server logs for errors
- In development, ensure polling is running

### Database connection failed
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

### CORS errors in frontend
- Verify `FRONTEND_URL` matches your frontend domain
- Check CORS configuration in backend

### Reminders not sending
- Check `REMINDER_TIME` is set correctly
- Verify bot has permission to message users
- Users must start the bot first with `/start`

## Future Enhancements

- [ ] Convert frontend to Telegram Mini App (TMA)
- [ ] Add habit streaks calculation
- [ ] Custom reminder times per habit
- [ ] Timezone support for users
- [ ] Habit categories and tags
- [ ] Weekly/monthly reports
- [ ] Data export functionality
- [ ] Habit templates

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
