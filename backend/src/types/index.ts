import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  reminderTime: number; // Hour in UTC (0-23)
  createdAt: Date;
  updatedAt: Date;
}

export interface Habit {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  enabled: boolean;
  targetPerMonth?: number;
  targetPerYear?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyLog {
  _id?: ObjectId;
  habitId: ObjectId;
  userId: ObjectId;
  timestamp: Date;
  createdAt: Date;
}
