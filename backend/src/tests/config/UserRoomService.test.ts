import { describe, it, expect, beforeEach, mock } from "bun:test";
import UserRoomService from "../../config/UserRoomService";

const mockRedisClient = {
  sAdd: mock(async (key: string, value: any) => 1),
  sIsMember: mock(async (key: string, value: any) => true),
  sMembers: mock(async (key: string) => ["user1", "user2"]),
};

describe("UserRoomService", () => {
  let userRoomService: UserRoomService;

  beforeEach(() => {
    // Reset mocks
    mockRedisClient.sAdd.mockClear();
    mockRedisClient.sIsMember.mockClear();
    mockRedisClient.sMembers.mockClear();

    // Create a new instance of the service with the mock client
    userRoomService = new UserRoomService(mockRedisClient as any);
  });

  describe("enrollUser", () => {
    it("should enroll a user successfully", async () => {
      const [error, status] = await userRoomService.enrollUser(
        "room123",
        "user1",
      );

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(mockRedisClient.sAdd).toHaveBeenCalledWith(
        "room:room123:users",
        "user1",
      );
    });

    it("should return an error if Redis fails", async () => {
      mockRedisClient.sAdd.mockRejectedValueOnce(new Error("Redis error"));
      const [error, status] = await userRoomService.enrollUser(
        "room123",
        "user1",
      );

      expect(error).toBeInstanceOf(Error);
      expect(status).toBe(500);
    });
  });

  describe("userExists", () => {
    it("should return true if user exists", async () => {
      const [error, exists, status] = await userRoomService.userExists(
        "room123",
        "user1",
      );

      expect(error).toBeNull();
      expect(exists).toBe(true);
      expect(status).toBe(200);
      expect(mockRedisClient.sIsMember).toHaveBeenCalledWith(
        "room:room123:users",
        "user1",
      );
    });

    it("should return false if user does not exist", async () => {
      mockRedisClient.sIsMember.mockResolvedValueOnce(false);
      const [error, exists, status] = await userRoomService.userExists(
        "room123",
        "user1",
      );

      expect(error).toBeNull();
      expect(exists).toBe(false);
      expect(status).toBe(200);
    });

    it("should return an error if Redis fails", async () => {
      mockRedisClient.sIsMember.mockRejectedValueOnce(new Error("Redis error"));
      const [error, exists, status] = await userRoomService.userExists(
        "room123",
        "user1",
      );

      expect(error).toBeInstanceOf(Error);
      expect(exists).toBe(false);
      expect(status).toBe(500);
    });
  });

  describe("getUsers", () => {
    it("should get all users successfully", async () => {
      const [error, users, status] = await userRoomService.getUsers("room123");

      expect(error).toBeNull();
      expect(users).toEqual(["user1", "user2"]);
      expect(status).toBe(200);
      expect(mockRedisClient.sMembers).toHaveBeenCalledWith(
        "room:room123:users",
      );
    });

    it("should return an error if Redis fails", async () => {
      mockRedisClient.sMembers.mockRejectedValueOnce(new Error("Redis error"));
      const [error, users, status] = await userRoomService.getUsers("room123");

      expect(error).toBeInstanceOf(Error);
      expect(users).toEqual([]);
      expect(status).toBe(200);
    });
  });

  describe("setUserVoted", () => {
    it("should set user as voted successfully", async () => {
      const [error, status] = await userRoomService.setUserVoted(
        "room123",
        "user1",
      );

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(mockRedisClient.sAdd).toHaveBeenCalledWith(
        "room:room123:voted",
        "user1",
      );
    });

    it("should return 404 if user does not exist", async () => {
      mockRedisClient.sIsMember.mockResolvedValueOnce(false);
      const [error, status] = await userRoomService.setUserVoted(
        "room123",
        "user1",
      );

      expect(error).toBeInstanceOf(Error);
      expect(status).toBe(404);
    });

    it("should return an error if Redis fails", async () => {
      mockRedisClient.sAdd.mockRejectedValueOnce(new Error("Redis error"));
      const [error, status] = await userRoomService.setUserVoted(
        "room123",
        "user1",
      );

      expect(error).toBeInstanceOf(Error);
      expect(status).toBe(500);
    });
  });

  describe("checkUserVoted", () => {
    it("should return true if user has voted", async () => {
      const [error, voted, status] = await userRoomService.checkUserVoted(
        "room123",
        "user1",
      );

      expect(error).toBeNull();
      expect(voted).toBe(true);
      expect(status).toBe(200);
      expect(mockRedisClient.sIsMember).toHaveBeenCalledWith(
        "room:room123:voted",
        "user1",
      );
    });

    it("should return false if user has not voted", async () => {
      mockRedisClient.sIsMember.mockResolvedValueOnce(false);
      const [error, voted, status] = await userRoomService.checkUserVoted(
        "room123",
        "user1",
      );

      expect(error).toBeNull();
      expect(voted).toBe(false);
      expect(status).toBe(200);
    });

    it("should return an error if Redis fails", async () => {
      mockRedisClient.sIsMember.mockRejectedValueOnce(new Error("Redis error"));
      const [error, voted, status] = await userRoomService.checkUserVoted(
        "room123",
        "user1",
      );

      expect(error).toBeInstanceOf(Error);
      expect(voted).toBe(false);
      expect(status).toBe(500);
    });
  });
});