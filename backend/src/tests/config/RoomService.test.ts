import { describe, it, expect, mock, beforeEach } from "bun:test";
import RoomService from "../../config/RoomService";
import type { RoomData } from "../../types/room";

// Mock Redis client
const createMockRedisClient = () => ({
  hSet: mock(async (key: string, values: any) => 1),
  hGet: mock(async (key: string, field: string) => "nominating"),
  exists: mock(async (key: string) => 1),
  expire: mock(async (key: string, ttl: number) => {}),
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
      await roomService.createRoom("room123", roomData);

      expect(mockRedisClient.hSet).toHaveBeenCalledWith(`room:room123`, {
        ...roomData,
      });
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        `room:room123`,
        expect.any(Number),
      );
    });
  });

  describe("setting and getting state", () => {
    it("should set the room state to voting successfully", async () => {
      await roomService.setVoting("room123");

      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        `room:room123`,
        "state",
        "voting",
      );
    });
    it("should set the room state to done successfully", async () => {
      await roomService.setDone("room123");

      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        `room:room123`,
        "state",
        "done",
      );
    });

    it("should get the room state successfully", async () => {
      const state = await roomService.getState("room123");

      expect(state).toBe("nominating");
      expect(mockRedisClient.hGet).toHaveBeenCalledWith(
        `room:room123`,
        "state",
      );
    });

    it("should return an empty string if state does not exist", async () => {
      mockRedisClient.hGet.mockResolvedValueOnce(null);
      const state = await roomService.getState("room123");

      expect(state).toBe("");
    });
  });

  describe("exists", () => {
    it("should return true if the room exists", async () => {
      mockRedisClient.exists.mockResolvedValueOnce(1);
      const exists = await roomService.exists("room123");

      expect(exists).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith(`room:room123`);
    });

    it("should return false if the room does not exist", async () => {
      mockRedisClient.exists.mockResolvedValueOnce(0);
      const exists = await roomService.exists("room123");

      expect(exists).toBe(false);
    });
  });

  describe("getHostKey", () => {
    it("should get the host key successfully", async () => {
      mockRedisClient.hGet.mockResolvedValueOnce("key123");
      const hostKey = await roomService.getHostKey("room123");

      expect(hostKey).toBe("key123");
      expect(mockRedisClient.hGet).toHaveBeenCalledWith(
        `room:room123`,
        "hostKey",
      );
    });

    it("should return an empty string if host key does not exist", async () => {
      mockRedisClient.hGet.mockResolvedValueOnce(null);
      const hostKey = await roomService.getHostKey("room123");

      expect(hostKey).toBe("");
    });
  });
});
