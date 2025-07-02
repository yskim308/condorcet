import express from "express";
import { io } from "../index";
import UserRoomService from "../config/UserRoomService";
import NomineeService from "../config/NomineeService";
import RoomService from "../config/RoomService";

const roomService = new RoomService();
const nomineeService = new NomineeService();
const userRoomService = new UserRoomService();

const router = express.Router();

interface joinBody {
  roomId: string;
  userName: string;
}
router.post(
  "/room/join",
  async (req: express.Request, res: express.Response) => {
    try {
      const { roomId, userName }: joinBody = req.body;

      if (!roomId || !userName) {
        res.status(400).json({ error: "roomId and userName are required" });
        return;
      }

      const roomExists = await redisClient.exists(`room:${roomId}`);
      if (!roomExists) {
        res.status(404).json({ error: "Room not found" });
        return;
      }

      const roomState = await redisClient.hGet(`room:${roomId}`, "state");
      if (roomState !== "nominating") {
        res.status(403).json({ error: "Room is not in a joinable state" });
        return;
      }

      await redisClient.sAdd(`room:${roomId}:users`, userName);

      io.to(roomId).emit("new-user", { userName, roomId });

      res.status(200).json({
        message: "Joined room successfully",
        roomId,
        userName,
      });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ error: "Failed to join room" });
    }
  },
);

router.get(
  "/room/:roomId/getRole",
  async (req: express.Request, res: express.Response) => {
    try {
      const { roomId } = req.params;
      const { hostKey } = req.body;

      const roomExists = await redisClient.exists(`room:${roomId}`);
      if (!roomExists) {
        res.status(404).json({ error: "Room not found" });
        return;
      }

      if (!hostKey) {
        res.status(200).json({ role: "user" });
        return;
      }

      const roomHostKey = await redisClient.hGet(`room:${roomId}`, "hostKey");
      if (hostKey === roomHostKey) {
        res.status(200).json({ role: "host" });
        return;
      } else {
        res.status(200).json({ role: "user" });
        return;
      }
    } catch (error) {
      console.error("Error getting role:", error);
      res.status(500).json({ error: "Failed to get role" });
    }
  },
);

export { router };
