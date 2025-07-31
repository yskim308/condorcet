import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";
import { createParticipantRouter } from "../../routes/participantRoutes";
import type SocketService from "../../config/SocketService";
import type RoomService from "../../config/RoomService";
import type NomineeService from "../../config/NomineeService";
import type UserRoomService from "../../config/UserRoomService";

// Mock services
const createMockSocketService = () => ({
  emitNewUser: mock(() => {}),
  emitNewVote: mock(() => {}),
});

const createMockRoomService = () => ({
  exists: mock(async () => true),
  getState: mock(async () => "nominating"),
  getHostKey: mock(async (): Promise<string> => "test-host-key"),
});

const createMockNomineeService = () => ({
  saveVote: mock(async () => {}),
  getAllNominees: mock(async () => ["nominee1", "nominee2"]),
  getWinner: mock(async () => "nominee1"),
});

const createMockUserRoomService = () => ({
  enrollUser: mock(async () => {}),
  getUsers: mock(async () => ["user1", "user2"]),
  checkUserVoted: mock(async () => false),
  getRole: mock(async () => "participant"),
  getVotedUsers: mock(async () => ["user1"]),
});

describe("Participant Routes", () => {
  let app: express.Application;
  let mockSocketService = createMockSocketService();
  let mockUserRoomService = createMockUserRoomService();
  let mockRoomService = createMockRoomService();
  let mockNomineeService = createMockNomineeService();
  beforeEach(() => {
    app = express();
    app.use(express.json());
    const participantRouter = createParticipantRouter(
      mockSocketService as any,
      mockUserRoomService as any,
      mockRoomService as any,
      mockNomineeService as any,
    );
    app.use(participantRouter);
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
      (mockRoomService.exists as any).mockResolvedValueOnce(false);
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
      (mockRoomService.exists as any).mockResolvedValueOnce(false);
      const response = await request(app)
        .post("/room/room123/getRoomData")
        .send({ userName: "user1" });
      expect(response.status).toBe(401);
    });

    it("should return voted users if state is 'voting'", async () => {
      (mockRoomService.getState as any).mockResolvedValueOnce("voting");
      const response = await request(app)
        .post("/room/room123/getRoomData")
        .send({ userName: "user1" });
      expect(response.status).toBe(200);
      expect(response.body.votedUsers).toEqual(["user1"]);
    });

    it("should return winner if state is 'done'", async () => {
      (mockRoomService.getState as any).mockResolvedValueOnce("done");
      const response = await request(app)
        .post("/room/room123/getRoomData")
        .send({ userName: "user1" });
      expect(response.status).toBe(200);
      expect(response.body.winner).toBe("nominee1");
    });
  });
});
