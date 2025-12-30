import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const game_sessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  players: jsonb("players").notNull(),
  winner: text("winner"),
  playedAt: text("played_at").notNull(),
});

export const insertGameSessionSchema = createInsertSchema(game_sessions);
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof game_sessions.$inferSelect;
