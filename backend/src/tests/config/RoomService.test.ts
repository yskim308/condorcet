import { describe, it, expect, mock, beforeEach } from "bun:test";
import RoomService from "../../config/RoomService";
import type { RoomData } from "../../types/room";

// Mock Redis client
const createMockRedisClient = () => ({
  hSet: mock(async (key: string, values: any) => 1),
  hGet: mock(async (key: string, field: string) => "nominating"),
  exists: mock(async (key: string) => 1),
});

describe("RoomService", () => {
  let roomService: RoomService;
  let mockRedisClient: ReturnType<typeof createMockRedisClient>;

  beforeEach(() => {
    // Create a new instance of RoomService with the mock client
    mockRedisClient = createMockRedisClient();
    roomService = new RoomService(mockRedisClient as any);
  });

  describe("createRoom", () => {
    it("should create a room successfully", async () => {
      const roomData: RoomData = {
        name: "Test Room",
        state: "nominating",
        host: "host123",
        hostKey: "key123",
      };
      const [error, status] = await roomService.createRoom("room123", roomData);

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        `room:room123`,
        roomData,
      );
    });
  });

  describe("setting and getting state", () => {
    it("should set the room state to voting successfully", async () => {
      const [error, status] = await roomService.setVoting("room123");

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        `room:room123`,
        "state",
        "voting",
      );
    });
    it("should set the room state to done successfully", async () => {
      const [error, status] = await roomService.setDone("room123");

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        `room:room123`,
        "state",
        "done",
      );
    });

    it("should get the room state successfully", async () => {
      const [error, state, status] = await roomService.getState("room123");

      expect(error).toBeNull();
      expect(state).toBe("nominating");
      expect(status).toBe(200);
      expect(mockRedisClient.hGet).toHaveBeenCalledWith(
        `room:room123`,
        "state",
      );
    });

    it("should return an empty string if state does not exist", async () => {
      mockRedisClient.hGet.mockResolvedValueOnce(null);
      const [error, state, status] = await roomService.getState("room123");

      expect(error).toBeNull();
      expect(state).toBe("");
      expect(status).toBe(200);
    });
  });

  describe("exists", () => {
    it("should return true if the room exists", async () => {
      mockRedisClient.exists.mockResolvedValueOnce(1);
      const [error, exists, status] = await roomService.exists("room123");

      expect(error).toBeNull();
      expect(exists).toBe(true);
      expect(status).toBe(200);
      expect(mockRedisClient.exists).toHaveBeenCalledWith(`room:room123`);
    });

    it("should return false if the room does not exist", async () => {
      mockRedisClient.exists.mockResolvedValueOnce(0);
      const [error, exists, status] = await roomService.exists("room123");

      expect(error).toBeNull();
      expect(exists).toBe(false);
      expect(status).toBe(200);
    });
  });

  describe("getHostKey", () => {
    it("should get the host key successfully", async () => {
      mockRedisClient.hGet.mockResolvedValueOnce("key123");
      const [error, hostKey, status] = await roomService.getHostKey("room123");

      expect(error).toBeNull();
      expect(hostKey).toBe("key123");
      expect(status).toBe(200);
      expect(mockRedisClient.hGet).toHaveBeenCalledWith(
        `room:room123`,
        "hostKey",
      );
    });

    it("should return an error if host key does not exist", async () => {
      mockRedisClient.hGet.mockResolvedValueOnce(null);
      const [error, hostKey, status] = await roomService.getHostKey("room123");

      expect(error).toBeInstanceOf(Error);
      expect(hostKey).toBe("");
      expect(status).toBe(404);
    });
  });
});

