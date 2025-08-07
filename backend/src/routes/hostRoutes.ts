import express from "express";
import type RoomService from "../config/RoomService";
import type NomineeService from "../config/NomineeService";
import type UserRoomService from "../config/UserRoomService";
import type { CreateVerifyHostMiddleware } from "../middleware/verifyHost";
import { randomBytes } from "crypto";
import type SocketService from "../config/SocketService";
import type { RoomData } from "../types/room";

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
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
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

        await roomService.createRoom(roomId, roomData);

        await userRoomService.enrollUser(roomId, userName);

        await nomineeService.setNomineeCount(roomId);
        res.status(201).json({
          roomId: roomId,
          roomName: roomName,
          message: "Room created successfully",
          hostKey: hostKey,
        });
        return;
      } catch (error) {
        next(error);
      }
    },
  );

  interface nominationBody {
    nominee: string;
  }
  router.post(
    "/rooms/:roomId/nomination",
    verifyHost,
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        const { roomId } = req.params;
        const { nominee }: nominationBody = req.body;

        if (!nominee) {
          res.status(400).json({ error: "nominee is required" });
          return;
        }

        await nomineeService.addNominee(roomId, nominee);
        socketService.emitNewNomination(roomId, nominee);

        res.status(200).json({
          message: "Nominee added successfully",
          nominee,
        });
        return;
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/rooms/:roomId/setVoting",
    verifyHost,
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        const { roomId } = req.params;
        await roomService.setVoting(roomId);
        socketService.emitStateChange(roomId, "voting");
        res.status(200).json({
          message: "room set to voting succesfully",
        });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/rooms/:roomId/setDone",
    verifyHost,
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        const { roomId } = req.params;
        const winner = await nomineeService.tallyVotes(roomId);
        await roomService.setDone(roomId);
        socketService.emitStateChange(roomId, "done");
        socketService.emitWinner(roomId, winner);
        res.status(200).json({
          message: "winner succesfully chosen",
          winner: winner,
        });
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
};
