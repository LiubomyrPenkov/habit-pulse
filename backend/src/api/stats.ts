import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { database } from '../database';

const router = Router();

// Get stats for a specific habit
router.get('/:habitId', async (req: Request, res: Response) => {
  try {
    const { habitId } = req.params;

    const totalLogs = await database.dailyLogs.countDocuments({
      habitId: new ObjectId(habitId),
    });

    res.json({
      habitId,
      totalLogs,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stats for all user habits
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const habits = await database.habits
      .find({ userId: new ObjectId(userId) })
      .toArray();

    const stats = await Promise.all(
      habits.map(async (habit) => {
        const totalLogs = await database.dailyLogs.countDocuments({
          habitId: habit._id,
          userId: new ObjectId(userId),
        });

        return {
          habitId: habit._id,
          habitName: habit.name,
          enabled: habit.enabled,
          totalLogs,
        };
      })
    );

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
