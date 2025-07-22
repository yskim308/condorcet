import express from "express";
import type RoomService from "../config/RoomService";
import type NomineeService from "../config/NomineeService";
import type UserRoomService from "../config/UserRoomService";
import type { CreateVerifyHostMiddleware } from "../middleware/verifyHost";
import { randomBytes } from "crypto";
import type SocketService from "../config/SocketService";
import type { RoomData, RoomState } from "../types/room";
import findWinner from "../util/findWinner";
import type { NomineeMap } from "../types/nominee";

export const createHostRouter = (
  socketService: SocketService,
  roomService: RoomService,
  nomineeService: NomineeService,
  userRoomService: UserRoomService,
  createVerifyHostMiddleware: CreateVerifyHostMiddleware,
) => {
  const router = express.Router();
  const verifyHost = createVerifyHostMiddleware(roomService);
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

        const [err2, code2] = await userRoomService.enrollUser(
          roomId,
          userName,
        );
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

  router.post(
    "rooms/:roomId/setVoting",
    verifyHost,
    async (req: express.Request, res: express.Response) => {
      try {
        const { roomId } = req.params;
        const [err, code] = await roomService.setVoting(roomId);
        if (err) {
          res
            .status(code)
            .json({ error: `couldn't set state to voting: ${err.message}` });
          return;
        }
        socketService.emitStateChange(roomId, "voting");
        res.status(200).json({
          message: "room set to voting succesfully",
        });
      } catch (error) {
        console.error("error setting room to ");
        res.status(500).json({ error: "Failed to set state to voting" });
        return;
      }
    },
  );

  router.post(
    "/rooms/:roomId/setDone",
    verifyHost,
    async (req: express.Request, res: express.Response) => {
      try {
        const { roomId } = req.params;
        const [winErr, winner, winCode] =
          await nomineeService.findWinner(roomId);
        if (winErr) {
          res.status(winCode).json({
            error: `error finding winner: ${winErr.message}`,
          });
        }

        const [err, code] = await roomService.setVoting(roomId);
        if (err) {
          res
            .status(code)
            .json({ error: `couldn't set room to voting: ${err.message}` });
          return;
        }

        socketService.emitStateChange(roomId, "done");
        socketService.emitWinner(roomId, winner);
        res.status(200).json({
          message: "winner succesfully chosen",
          winner: winner,
        });
      } catch (error) {
        console.error("error setting room to ");
        res.status(500).json({ error: "Failed to set state to voting" });
        return;
      }
    },
  );
  return router;
};
