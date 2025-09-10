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
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        const { roomId, userName }: joinBody = req.body;

        if (!roomId || !userName) {
          res.status(400).json({ error: "roomId and userName are required" });
          return;
        }

        // check if room exists
        const roomExists = await roomService.exists(roomId);
        if (!roomExists) {
          res.status(404).json({ error: "Room not found" });
          return;
        }

        // 'join' the user to the room
        await userRoomService.enrollUser(roomId, userName);
        socketService.emitNewUser(roomId, userName);

        res.status(200).json({
          message: "Joined room successfully",
          roomId,
          userName,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  interface GetRoomDataBody {
    userName: string;
  }
  router.post(
    "/room/:roomId/getRoomData",
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        const { roomId } = req.params;
        const { userName }: GetRoomDataBody = req.body;
        // check if the room exists
        const exists = await roomService.exists(roomId);
        if (!exists) {
          res.status(401).json({
            error: "room does not exist",
          });
          return;
        }

        // get the role
        const role = await userRoomService.getRole(roomId, userName);
        // get users
        const users = await userRoomService.getUsers(roomId);
        // get the state
        const state = await roomService.getState(roomId);
        if (!state) {
          res.status(500).json({
            error: "state is null",
          });
          return;
        }

        // get nominations
        const nominations = await nomineeService.getAllNominees(roomId);
        if (!nominations) {
          res.status(500).json({
            error: "nominations are null",
          });
          return;
        }

        let votedUsersResponse: string[] | undefined;
        let winnerResponse: string | undefined;

        if (state === "voting") {
          const votedUsers = await userRoomService.getVotedUsers(roomId);
          votedUsersResponse = votedUsers;
        }
        if (state === "done") {
          const winner = await nomineeService.getWinner(roomId);
          winnerResponse = winner;
        }

        const responseData: any = {
          role,
          users,
          state,
          nominations,
        };

        if (votedUsersResponse) {
          responseData.votedUsers = votedUsersResponse;
        }
        if (winnerResponse) {
          responseData.winner = winnerResponse;
        }

        res.status(200).json(responseData);
      } catch (error: unknown) {
        next(error);
      }
    },
  );

  interface VoteBody {
    vote: string[];
    userName: string;
  }
  router.post(
    "/room/:roomId/vote",
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        const { vote, userName }: VoteBody = req.body;
        const { roomId } = req.params;

        // check if user already voted
        const voted = await userRoomService.checkUserVoted(roomId, userName);
        if (voted) {
          res.status(404).json({ error: "user already voted" });
          return;
        }

        await nomineeService.saveVote(roomId, vote);
        await userRoomService.setUserVoted(roomId, userName);
        socketService.emitNewVote(roomId, userName);

        res.status(200).json({ message: "vote saved" });
        return;
      } catch (error: unknown) {
        next(error);
      }
    },
  );

  return router;
};
