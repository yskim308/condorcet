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

  interface GetRoomDataBody {
    userName: string;
  }
  router.post(
    "/room/:roomId/getRoomData",
    async (req: express.Request, res: express.Response) => {
      try {
        const { roomId } = req.params;
        const { userName } = req.body;
        // check if the room exists
        const [existErr, exists, existCode] = await roomService.exists(roomId);
        if (existErr) {
          res.status(existCode).json({
            error: `error when checking if room exists: ${existErr.message}`,
          });
          return;
        }
        if (!exists) {
          res.status(401).json({
            error: "room does not exist",
          });
          return;
        }

        // get the role
        const [roleErr, role, roleCode] = await userRoomService.getRole(
          roomId,
          userName,
        );
        if (roleErr) {
          res.status(roleCode).json({
            error: `Error while getting role of user ${userName}: ${roleErr.message}`,
          });
          return;
        }

        // get users
        const [userErr, users, userCode] =
          await userRoomService.getUsers(roomId);
        if (userErr) {
          res.status(userCode).json({
            error: `error whiel getting users in room: ${userErr.message}`,
          });
          return;
        }

        // get the state
        const [stateErr, state, stateCode] = await roomService.getState(roomId);
        if (stateErr) {
          res.status(stateCode).json({
            error: `error while getting state of room ${roomId}: ${stateErr?.message}`,
          });
          return;
        }
        if (!state) {
          res.status(500).json({
            error: "state is null",
          });
          return;
        }

        // get nominations
        const [nominationErr, nominations, nominationCode] =
          await nomineeService.getAllNominees(roomId);
        if (nominationErr) {
          res.status(nominationCode).json({
            error: `error while getting nominations in room: ${nominationErr.message}`,
          });
          return;
        }
        if (!nominations) {
          res.status(500).json({
            error: "nominations are null",
          });
          return;
        }

        let votedUsersResponse: string[] | undefined;
        let winnerResponse: string | undefined;

        if (state === "voting") {
          const [votedErr, votedUsers, votedCode] =
            await userRoomService.getVotedUsers(roomId);
          if (votedErr) {
            res.status(votedCode).json({
              error: `Error while getting voted users: ${votedErr.message}`,
            });
            return;
          }
          votedUsersResponse = votedUsers;
        }

        if (state === "done") {
          const [winnerErr, winner, winnerCode] =
            await nomineeService.getWinner(roomId);
          if (winnerErr) {
            res.status(winnerCode).json({
              error: `Error while getting the winner: ${winnerErr.message}`,
            });
            return;
          }
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
      } catch (error: unknown) {}
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
