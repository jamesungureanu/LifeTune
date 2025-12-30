import { db } from "./db";
import { game_sessions, type GameSession, type InsertGameSession } from "@shared/schema";

export interface IStorage {
  createSession(session: InsertGameSession): Promise<GameSession>;
  getSessions(): Promise<GameSession[]>;
}

export class DatabaseStorage implements IStorage {
  async createSession(session: InsertGameSession): Promise<GameSession> {
    const [newSession] = await db.insert(game_sessions).values(session).returning();
    return newSession;
  }

  async getSessions(): Promise<GameSession[]> {
    return await db.select().from(game_sessions).limit(10);
  }
}

export const storage = new DatabaseStorage();
