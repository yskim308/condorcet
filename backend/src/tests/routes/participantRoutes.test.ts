import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";
import { createParticipantRouter } from "../../routes/participantRoutes";
import type SocketService from "../../config/SocketService";
import type RoomService from "../../config/RoomService";
import type NomineeService from "../../config/NomineeService";
import type UserRoomService from "../../config/UserRoomService";

// Mock services
const mockSocketService: Partial<SocketService> = {
  emitNewUser: mock(() => {}),
  emitNewVote: mock(() => {}),
};

const mockRoomService: Partial<RoomService> = {
  exists: mock(
    async (): Promise<[Error | null, boolean, number]> => [null, true, 200],
  ),
  getState: mock(
    async (): Promise<[Error | null, string, number]> => [
      null,
      "nominating",
      200,
    ],
  ),
  getHostKey: mock(
    async (): Promise<[Error | null, string, number]> => [
      null,
      "test-host-key",
      200,
    ],
  ),
};

const mockNomineeService: Partial<NomineeService> = {
  saveVote: mock(async (): Promise<[Error | null, number]> => [null, 200]),
  getAllNominees: mock(
    async (): Promise<[Error | null, string[], number]> => [
      null,
      ["nominee1", "nominee2"],
      200,
    ],
  ),
  getWinner: mock(
    async (): Promise<[Error | null, string, number]> => [null, "nominee1", 200],
  ),
};

const mockUserRoomService: Partial<UserRoomService> = {
  enrollUser: mock(async (): Promise<[Error | null, number]> => [null, 200]),
  getUsers: mock(
    async (): Promise<[Error | null, string[], number]> => [
      null,
      ["user1", "user2"],
      200,
    ],
  ),
  checkUserVoted: mock(
    async (): Promise<[Error | null, boolean, number]> => [null, false, 200],
  ),
  getRole: mock(
    async (): Promise<[Error | null, string, number]> => [
      null,
      "participant",
      200,
    ],
  ),
  getVotedUsers: mock(
    async (): Promise<[Error | null, string[], number]> => [
      null,
      ["user1"],
      200,
    ],
  ),
};

describe("Participant Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const participantRouter = createParticipantRouter(
      mockSocketService as SocketService,
      mockUserRoomService as UserRoomService,
      mockRoomService as RoomService,
      mockNomineeService as NomineeService,
    );
    app.use(participantRouter);

    // Reset mocks
    for (const key in mockSocketService) {
      (mockSocketService[key as keyof SocketService] as any).mockClear();
    }
    for (const key in mockRoomService) {
      (mockRoomService[key as keyof RoomService] as any).mockClear();
    }
    for (const key in mockNomineeService) {
      (mockNomineeService[key as keyof NomineeService] as any).mockClear();
    }
    for (const key in mockUserRoomService) {
      (mockUserRoomService[key as keyof UserRoomService] as any).mockClear();
    }
  });

  describe("POST /room/join", () => {
    it("should join a room successfully", async () => {
      const response = await request(app).post("/room/join").send({
        roomId: "room123",
        userName: "user1",
      });

      expect(response.status).toBe(200);
      expect(mockRoomService.exists).toHaveBeenCalledWith("room123");
      expect(mockUserRoomService.enrollUser).toHaveBeenCalledWith(
        "room123",
        "user1",
      );
      expect(mockSocketService.emitNewUser).toHaveBeenCalledWith(
        "room123",
        "user1",
      );
    });

    it("should return 400 if roomId or userName is missing", async () => {
      const res1 = await request(app)
        .post("/room/join")
        .send({ userName: "user1" });
      const res2 = await request(app)
        .post("/room/join")
        .send({ roomId: "room123" });
      expect(res1.status).toBe(400);
      expect(res2.status).toBe(400);
    });

    it("should return 404 if room does not exist", async () => {
      (mockRoomService.exists as any).mockResolvedValueOnce([null, false, 404]);
      const response = await request(app).post("/room/join").send({
        roomId: "room123",
        userName: "user1",
      });
      expect(response.status).toBe(404);
    });
  });

  describe("POST /room/:roomId/vote", () => {
    it("should save a vote successfully", async () => {
      const response = await request(app)
        .post("/room/room123/vote")
        .send({ vote: ["nominee1"], userName: "user1" });

      expect(response.status).toBe(200);
      expect(mockUserRoomService.checkUserVoted).toHaveBeenCalledWith(
        "room123",
        "user1",
      );
      expect(mockNomineeService.saveVote).toHaveBeenCalledWith("room123", [
        "nominee1",
      ]);
      expect(mockSocketService.emitNewVote).toHaveBeenCalledWith(
        "room123",
        "user1",
      );
    });

    it("should return 404 if user has already voted", async () => {
      (mockUserRoomService.checkUserVoted as any).mockResolvedValueOnce([
        null,
        true,
        200,
      ]);
      const response = await request(app)
        .post("/room/room123/vote")
        .send({ vote: ["nominee1"], userName: "user1" });
      expect(response.status).toBe(404);
    });
  });

  describe("POST /room/:roomId/getRoomData", () => {
    it("should return all room data successfully", async () => {
      // Mocks
      (mockRoomService.exists as any).mockResolvedValueOnce([null, true, 200]);
      (mockUserRoomService.getRole as any).mockResolvedValueOnce([
        null,
        "participant",
        200,
      ]);
      (mockUserRoomService.getUsers as any).mockResolvedValueOnce([
        null,
        ["user1", "user2"],
        200,
      ]);
      (mockRoomService.getState as any).mockResolvedValueOnce([
        null,
        "nominating",
        200,
      ]);
      (mockNomineeService.getAllNominees as any).mockResolvedValueOnce([
        null,
        ["nominee1", "nominee2"],
        200,
      ]);

      const response = await request(app)
        .post("/room/room123/getRoomData")
        .send({ userName: "user1" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: "participant",
        users: ["user1", "user2"],
        state: "nominating",
        nominations: ["nominee1", "nominee2"],
      });
    });

    it("should return an error if the room does not exist", async () => {
      (mockRoomService.exists as any).mockResolvedValueOnce([null, false, 404]);
      const response = await request(app)
        .post("/room/room123/getRoomData")
        .send({ userName: "user1" });
      expect(response.status).toBe(401);
    });

    it("should return voted users if state is 'voting'", async () => {
      (mockRoomService.getState as any).mockResolvedValueOnce([
        null,
        "voting",
        200,
      ]);
      (mockUserRoomService.getVotedUsers as any).mockResolvedValueOnce([
        null,
        ["user1"],
        200,
      ]);
      const response = await request(app)
        .post("/room/room123/getRoomData")
        .send({ userName: "user1" });
      expect(response.status).toBe(200);
      expect(response.body.votedUsers).toEqual(["user1"]);
    });

    it("should return winner if state is 'done'", async () => {
      (mockRoomService.getState as any).mockResolvedValueOnce([
        null,
        "done",
        200,
      ]);
      (mockNomineeService.getWinner as any).mockResolvedValueOnce([
        null,
        "nominee1",
        200,
      ]);
      const response = await request(app)
        .post("/room/room123/getRoomData")
        .send({ userName: "user1" });
      expect(response.status).toBe(200);
      expect(response.body.winner).toBe("nominee1");
    });
  });
});

