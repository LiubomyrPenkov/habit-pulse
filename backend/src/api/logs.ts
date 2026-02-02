import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { database } from '../database';

const router = Router();

// Log a habit
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, habitId } = req.body;

    if (!userId || !habitId) {
      return res.status(400).json({ error: 'User ID and Habit ID are required' });
    }

    // Check if habit exists
    const habit = await database.habits.findOne({
      _id: new ObjectId(habitId),
      userId: new ObjectId(userId),
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Check if already logged today
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingLog = await database.dailyLogs.findOne({
      habitId: new ObjectId(habitId),
      userId: new ObjectId(userId),
      timestamp: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (existingLog) {
      return res.status(409).json({ error: 'Habit already logged today' });
    }

    // Create log entry
    const result = await database.dailyLogs.insertOne({
      habitId: new ObjectId(habitId),
      userId: new ObjectId(userId),
      timestamp: new Date(),
      createdAt: new Date(),
    });

    const log = await database.dailyLogs.findOne({ _id: result.insertedId });

    res.status(201).json(log);
  } catch (error) {
    console.error('Log habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get logs for a habit
router.get('/:habitId', async (req: Request, res: Response) => {
  try {
    const { habitId } = req.params;

    const logs = await database.dailyLogs
      .find({ habitId: new ObjectId(habitId) })
      .sort({ timestamp: -1 })
      .toArray();

    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
