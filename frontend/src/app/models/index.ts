export interface User {
  userId: string;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
}

export interface Habit {
  _id: string;
  userId: string;
  name: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyLog {
  _id: string;
  habitId: string;
  userId: string;
  timestamp: Date;
  createdAt: Date;
}

export interface HabitStats {
  habitId: string;
  habitName: string;
  enabled: boolean;
  totalLogs: number;
}
