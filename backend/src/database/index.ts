import { MongoClient, Db, Collection, Document, ObjectId } from 'mongodb';
import { config } from '../config';
import { User, Habit, DailyLog } from '../types';

class Database {
  private client: MongoClient;
  private db: Db | null = null;

  constructor() {
    this.client = new MongoClient(config.mongodb.uri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db();
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }

  getCollection<T extends Document>(name: string): Collection<T> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection<T>(name);
  }

  parseObjectId(id: string): ObjectId {
    return new ObjectId(id);
  }

  get users(): Collection<User> {
    return this.getCollection<User>('users');
  }

  get habits(): Collection<Habit> {
    return this.getCollection<Habit>('habits');
  }

  get dailyLogs(): Collection<DailyLog> {
    return this.getCollection<DailyLog>('dailyLogs');
  }
}

export const database = new Database();
