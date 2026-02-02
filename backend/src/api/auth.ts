import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { database } from '../database';

const router = Router();

// Verify Telegram ID and return user info
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { telegramId } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }

    const user = await database.users.findOne({ telegramId: parseInt(telegramId) });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please start the bot first.' });
    }

    res.json({
      userId: user._id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
