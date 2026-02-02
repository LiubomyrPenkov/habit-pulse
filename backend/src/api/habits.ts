import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { database } from '../database';

const router = Router();

// Get all habits for a user
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const habits = await database.habits
      .find({ userId: new ObjectId(userId as string) })
      .toArray();

    res.json(habits);
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new habit
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, name } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'User ID and habit name are required' });
    }

    // Check if habit already exists
    const existing = await database.habits.findOne({
      userId: new ObjectId(userId),
      name,
    });

    if (existing) {
      return res.status(409).json({ error: 'Habit with this name already exists' });
    }

    const result = await database.habits.insertOne({
      userId: new ObjectId(userId),
      name,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const habit = await database.habits.findOne({ _id: result.insertedId });

    res.status(201).json(habit);
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a habit
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, enabled } = req.body;

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateFields.name = name;
    if (enabled !== undefined) updateFields.enabled = enabled;

    const result = await database.habits.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const habit = await database.habits.findOne({ _id: new ObjectId(id) });

    res.json(habit);
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a habit
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await database.habits.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Also delete all logs for this habit
    await database.dailyLogs.deleteMany({ habitId: new ObjectId(id) });

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
