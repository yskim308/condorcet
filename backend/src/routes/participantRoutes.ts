import express from "express";
import UserRoomService from "../config/UserRoomService";
import RoomService from "../config/RoomService";
import SocketService from "../config/SocketService";

export const createParticipantRouter = (socketService: SocketService) => {
  const router = express.Router();
  const roomService = new RoomService();
  const userRoomService = new UserRoomService();

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

        // check if room exists
        const [existsErr, roomExists, codeExists] =
          await roomService.exists(roomId);
        if (existsErr) {
          res.status(codeExists).json({
            error: `Failed to check if room exists: ${existsErr.message}`,
          });
          return;
        }
        if (!roomExists) {
          res.status(404).json({ error: "Room not found" });
          return;
        }

        // check if the state of the room is 'nominating'
        const [stateErr, roomState, codeState] =
          await roomService.getState(roomId);
        if (stateErr) {
          res
            .status(codeState)
            .json({ error: `Failed to get room state: ${stateErr.message}` });
          return;
        }
        if (roomState !== "nominating") {
          res.status(403).json({ error: "Room is not in a joinable state" });
          return;
        }

        // 'join' the user to the room
        const [enrollErr, codeEnroll] = await userRoomService.enrollUser(
          roomId,
          userName,
        );
        if (enrollErr) {
          res
            .status(codeEnroll)
            .json({ error: `Failed to join room: ${enrollErr.message}` });
          return;
        }

        socketService.emitNewUser(roomId, userName);

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

  interface GetRoleBody {
    hostKey: string;
  }
  router.post(
    "/room/:roomId/getRole",
    async (req: express.Request, res: express.Response) => {
      try {
        const { roomId } = req.params;
        const { hostKey }: GetRoleBody = req.body;

        // check if the room exists
        const [existsErr, roomExists, codeExists] =
          await roomService.exists(roomId);
        if (existsErr) {
          res.status(codeExists).json({
            error: `Failed to check if room exists: ${existsErr.message}`,
          });
          return;
        }
        if (!roomExists) {
          res.status(404).json({ error: "Room not found" });
          return;
        }

        if (!hostKey) {
          res.status(200).json({ role: "user" });
          return;
        }

        // get the hostkey of the room
        const [keyErr, roomHostKey, codeKey] =
          await roomService.getHostKey(roomId);
        if (keyErr) {
          res
            .status(codeKey)
            .json({ error: `Failed to get role: ${keyErr.message}` });
          return;
        }

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

  return router;
};