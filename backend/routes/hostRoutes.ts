import express from "express";
import { redisClient, io } from "../index.js";
import { randomBytes } from "crypto";
import { verifyJwt } from "../middleware/verifyJwt.js";
import jwt from "jsonwebtoken";

type RoomState = "nominating" | "voting" | "done";

const router = express.Router();
const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
  throw new Error("secret key not defiend in .env");
}

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

      const roomData = {
        name: roomName,
        state: "nominating",
        host: userName,
      };

      await redisClient.hSet(`room:${roomId}`, roomData);
      await redisClient.sAdd(`room:${roomId}:users`, userName);
      await redisClient.set(`room:${roomId}:nominee_count`, -1); // 0 index nominees

      const payload = {
        userName: userName,
        roomId: roomId,
      };

      const token = jwt.sign(payload, secretKey, { expiresIn: "30m" });
      res.status(201).json({
        roomId: roomId,
        roomName: roomName,
        message: "Room created successfully",
        token: token,
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
  userName?: string;
}
router.post(
  "/rooms/:roomId/nomination",
  verifyJwt,
  async (req: express.Request, res: express.Response) => {
    try {
      const { roomId } = req.params;
      const { nominee, userName }: nominationBody = req.body;

      if (!userName) {
        res.status(401).json({ error: "no username from middleware" });
      }
      if (!nominee) {
        res.status(400).json({ error: "nominee is required" });
        return;
      }

      const roomExists = await redisClient.exists(`room:${roomId}`);
      if (!roomExists) {
        res.status(404).json({ error: "Room not found" });
        return;
      }

      const host = await redisClient.hget(`room:${roomId}`, "host");
      if (userName != host) {
        res.status(403).json({ error: "client is not the host" });
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
  userName?: string;
}
router.post(
  "/rooms/:roomId/state",
  verifyJwt,
  async (req: express.Request, res: express.Response) => {
    try {
      const { roomId } = req.params;
      const { state, userName }: StateBody = req.body;

      if (!userName) {
        res.status(401).json({ error: "no username from middleware" });
      }

      if (!state || !["nominating", "voting", "done"].includes(state)) {
        res.status(400).json({
          error:
            "state is required and must be 'nominating', 'voting', or 'done'",
        });
        return;
      }

      const roomExists = await redisClient.exists(`room:${roomId}`);
      if (!roomExists) {
        res.status(404).json({ error: "room not found" });
        return;
      }

      const host = await redisClient.hget(`room:${roomId}`, "host");
      if (userName != host) {
        res.status(403).json({ error: "client is not the host" });
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
