import express from "express";
import { socketService } from "../index";
import RoomService from "../config/RoomService";
import NomineeService from "../config/NomineeService";
import UserRoomService from "../config/UserRoomService";
import { randomBytes } from "crypto";

const roomService = new RoomService();
const nomineeService = new NomineeService();
const userRoomService = new UserRoomService();

type RoomState = "nominating" | "voting" | "done";

export interface RoomData {
  name: string;
  state: RoomState;
  host: string;
  hostKey: string;
}
const router = express.Router();

import { verifyHost } from "../middleware/verifyHost";

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

      const roomData: RoomData = {
        name: roomName,
        state: "nominating",
        host: userName,
        hostKey: hostKey,
      };

      const [err1, code1] = await roomService.createRoom(roomId, roomData);
      if (err1) {
        console.error(`Error creating room ${roomId}: ${err1.message}`);
        res
          .status(code1)
          .json({ error: `redis failed to create room: ${err1.message}` });
        return;
      }

      const [err2, code2] = await userRoomService.enrollUser(roomId, userName);
      if (err2) {
        console.error(
          `Error enrolling user ${userName} in room ${roomId}: ${err2.message}`,
        );
        res
          .status(code2)
          .json({ error: `redis failed to enroll user: ${err2.message}` });
        return;
      }

      const [err3, code3] = await nomineeService.setNomineeCount(roomId);
      if (err3) {
        console.error(
          `Error setting nominee count for room ${roomId}: ${err3.message}`,
        );
        res.status(code3).json({
          error: `redis failed to initialize nominee count: ${err3.message}`,
        });
        return;
      }
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

      const [err, code] = await nomineeService.addNominee(roomId, nominee);
      if (err) {
        res
          .status(code)
          .json({ error: `redis failed to add nominee: ${err.message}` });
        return;
      }

      socketService.emitNewNomination(roomId, nominee);

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

      const [err, code] = await roomService.updateState(roomId, state);
      if (err) {
        res
          .status(code)
          .json({ error: `redis failed to update room state: ${err.message}` });
        return;
      }

      socketService.emitStateChange(roomId, state);

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
