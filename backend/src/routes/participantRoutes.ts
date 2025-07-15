import express from "express";
import type UserRoomService from "../config/UserRoomService";
import type RoomService from "../config/RoomService";
import type NomineeService from "../config/NomineeService";
import type SocketService from "../config/SocketService";

export const createParticipantRouter = (
  socketService: SocketService,
  userRoomService: UserRoomService,
  roomService: RoomService,
  nomineeService: NomineeService,
) => {
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

  router.get(
    "/room/:roomId/getUsers",
    async (req: express.Request, res: express.Response) => {
      try {
        const { roomId } = req.params;
        const [err, users, code] = await userRoomService.getUsers(roomId);
        if (err) {
          res.status(code).json({
            error: `failed to get users from room: ${err.message}`,
          });
          return;
        }
        res.status(200).json({ users });
      } catch (error: unknown) {
        console.error("error getting users ", error);
        res.status(500).json({ error: "failed to getUsers in room" });
      }
    },
  );

  interface VoteBody {
    vote: string[];
    userName: string;
  }
  router.post(
    "/room/:roomId/vote",
    async (req: express.Request, res: express.Response) => {
      try {
        const { vote, userName }: VoteBody = req.body;
        const { roomId } = req.params;

        // check if user already voted
        const [checkErr, voted, checkCode] =
          await userRoomService.checkUserVoted(roomId, userName);
        if (checkErr) {
          res.status(checkCode).json({
            error: `failed to check if user voted: ${checkErr.message}`,
          });
          return;
        }
        if (voted) {
          res.status(404).json({ error: "user already voted" });
          return;
        }

        // set the vote in redis
        const [voteErr, voteCode] = await nomineeService.saveVote(roomId, vote);
        if (voteErr) {
          res
            .status(voteCode)
            .json({ error: `failed to save vote: ${voteErr.message}` });
        }

        // emit on socket
        socketService.emitNewVote(roomId, userName);

        res.status(200).json({ message: "vote saved" });
        return;
      } catch (error: unknown) {
        console.error("error posting vote: ", error);
        res.status(500).json({ error: "failed to register vote" });
      }
    },
  );

  return router;
};
