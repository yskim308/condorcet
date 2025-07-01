import express from "express";
import { redisClient, io } from "../index.js";
import { randomBytes } from "crypto";

type RoomState = "nominating" | "voting" | "done";

const router = express.Router();

import { verifyHost } from "../middleware/verifyHost.js";

interface createBody {
  roomName: string;
  userName: string;
}
router.post(
  "/rooms/create",
  async (req: express.Request, res: express.Response) => {
    try {
      const { roomName, userName }: createBody = req.body;

      if (!roomName || !userName) {
        res.status(400).json({ error: "roomName and userId are required" });
        return;
      }

      const roomId = randomBytes(8).toString("hex");
      const hostKey = randomBytes(16).toString("hex");

      const roomData = {
        name: roomName,
        state: "nominating",
        host: userName,
        hostKey: hostKey,
      };

      await redisClient.hSet(`room:${roomId}`, roomData);
      await redisClient.sAdd(`room:${roomId}:users`, userName);
      await redisClient.set(`room:${roomId}:nominee_count`, -1); // 0 index nominees

      res.status(201).json({
        roomId: roomId,
        roomName: roomName,
        message: "Room created successfully",
        hostKey: hostKey,
      });
      return;
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Failed to create room" });
      return;
    }
  },
);

interface nominationBody {
  nominee: string;
  hostKey: string;
}
router.post(
  "/rooms/:roomId/nomination",
  verifyHost,
  async (req: express.Request, res: express.Response) => {
    try {
      const { roomId } = req.params;
      const { nominee }: nominationBody = req.body;

      if (!nominee) {
        res.status(400).json({ error: "nominee is required" });
        return;
      }

      const nomineed_id = await redisClient.incr(
        `room:${roomId}:nominee_count`,
      );
      await redisClient.hSet(
        `room:${roomId}:nominees`,
        nomineed_id.toString(),
        nominee,
      );

      io.to(roomId).emit("new-nomination", { nominee, roomId });

      res.status(200).json({
        message: "Nominee added successfully",
        nominee,
      });
      return;
    } catch (error) {
      console.error("Error adding nominee:", error);
      res.status(500).json({ error: "Failed to add nominee" });
      return;
    }
  },
);

interface StateBody {
  state: RoomState;
  hostKey: string;
}
router.post(
  "/rooms/:roomId/state",
  verifyHost,
  async (req: express.Request, res: express.Response) => {
    try {
      const { roomId } = req.params;
      const { state }: StateBody = req.body;

      if (!state || !["nominating", "voting", "done"].includes(state)) {
        res.status(400).json({
          error:
            "state is required and must be 'nominating', 'voting', or 'done'",
        });
        return;
      }

      await redisClient.hSet(`room:${roomId}`, "state", state);

      io.to(roomId).emit("state-change", { state, roomId });

      res.status(200).json({
        message: "Room state updated successfully",
        state,
      });
      return;
    } catch (error) {
      console.error("Error updating room state:", error);
      res.status(500).json({ error: "Failed to update room state" });
      return;
    }
  },
);

export { router };
