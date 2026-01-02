import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.sessions.create.path, async (req, res) => {
    try {
      const input = api.sessions.create.input.parse(req.body);
      const session = await storage.createSession(input);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      console.error("Create session failed:", err);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get(api.sessions.list.path, async (_req, res) => {
    try {
      const sessions = await storage.getSessions();
      res.json(sessions);
    } catch (err) {
      console.error("List sessions failed:", err);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  return httpServer;
}
