import express from "express";
import { redisClient, io } from "../index.js";
import { randomBytes } from "crypto";

type RoomState = "nominating" | "voting" | "done";

const router = express.Router();

router.post(
  "/rooms/create",
  async (req: express.Request, res: express.Response) => {
    try {
      const { roomName, userId } = req.body;

      if (!roomName || !userId) {
        res.status(400).json({ error: "roomName and userId are required" });
      }

      const roomId = randomBytes(8).toString("hex");

      const roomData = {
        name: roomName,
        state: "nominating",
        host: userId,
      };

      await redisClient.hSet(`room:${roomId}`, roomData);
      await redisClient.sAdd(`room:${roomId}:users`, userId);

      res.status(201).json({
        roomId,
        roomName,
        message: "Room created successfully",
      });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  },
);

router.post(
  "/rooms/:roomId/nomination",
  async (req: express.Request, res: express.Response) => {
    try {
      const { roomId } = req.params;
      const { nominee } = req.body;

      if (!nominee) {
        res.status(400).json({ error: "nominee is required" });
      }

      const roomExists = await redisClient.exists(`room:${roomId}`);
      if (!roomExists) {
        res.status(404).json({ error: "Room not found" });
      }

      await redisClient.lPush(`room:${roomId}:nominees`, nominee);

      io.to(roomId).emit("new-nomination", { nominee, roomId });

      res.status(200).json({
        message: "Nominee added successfully",
        nominee,
      });
    } catch (error) {
      console.error("Error adding nominee:", error);
      res.status(500).json({ error: "Failed to add nominee" });
    }
  },
);

router.post(
  "/rooms/:roomId/state",
  async (req: express.Request, res: express.Response) => {
    try {
      const { roomId } = req.params;
      const { state }: { state: RoomState } = req.body;

      if (!state || !["nominating", "voting", "done"].includes(state)) {
        res.status(400).json({
          error:
            "state is required and must be 'nominating', 'voting', or 'done'",
        });
      }

      const roomExists = await redisClient.exists(`room:${roomId}`);
      if (!roomExists) {
        res.status(404).json({ error: "room not found" });
      }

      await redisClient.hSet(`room:${roomId}`, "state", state);

      io.to(roomId).emit("state-change", { state, roomId });

      res.status(200).json({
        message: "Room state updated successfully",
        state,
      });
    } catch (error) {
      console.error("Error updating room state:", error);
      res.status(500).json({ error: "Failed to update room state" });
    }
  },
);

export { router };
