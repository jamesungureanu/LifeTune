import { getDb } from "./db";
import { game_sessions, type GameSession, type InsertGameSession } from "@shared/schema";

export class DatabaseStorage {
  async createSession(session: InsertGameSession): Promise<GameSession> {
    const db = getDb();
    const [newSession] = await db
      .insert(game_sessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getSessions(): Promise<GameSession[]> {
    const db = getDb();
    return await db.select().from(game_sessions).limit(10);
  }
}

export const storage = new DatabaseStorage();
