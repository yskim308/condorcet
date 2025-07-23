import { describe, it, expect, beforeEach, mock } from "bun:test";
import UserRoomService from "../../config/UserRoomService";

const HOST_USER = "user1";
const USER = "user2";
const VOTED_USERS = ["user1", "user2"];

const createMockRedisClient = () => ({
  sAdd: mock(async (key: string, value: any) => 1),
  sIsMember: mock(async (key: string, value: any) => true),
  sMembers: mock(async (key: string) => VOTED_USERS),
  hGet: mock(async (key: string, field: string) => HOST_USER),
});

describe("UserRoomService", () => {
  let userRoomService: UserRoomService;
  let mockRedisClient: ReturnType<typeof createMockRedisClient>;
  beforeEach(() => {
    mockRedisClient = createMockRedisClient();
    userRoomService = new UserRoomService(mockRedisClient as any);
  });

  describe("user operations", () => {
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

    it("should get all users successfully", async () => {
      const [error, users, status] = await userRoomService.getUsers("room123");

      expect(error).toBeNull();
      expect(users).toEqual(["user1", "user2"]);
      expect(status).toBe(200);
      expect(mockRedisClient.sMembers).toHaveBeenCalledWith(
        "room:room123:users",
      );
    });

    it("should return host if the user is host", async () => {
      const [error, role, status] = await userRoomService.getRole(
        "room123",
        HOST_USER,
      );
      expect(error).toBeNull();
      expect(role).toBe("host");
      expect(status).toBe(200);
    });

    it("should return user otherwise", async () => {
      const [error, role, status] = await userRoomService.getRole(
        "room123",
        USER,
      );
      expect(error).toBeNull();
      expect(role).toBe("user");
      expect(status).toBe(200);
    });
  });

  describe("user voting", () => {
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
    it("should return 404 if user does not exist while setting", async () => {
      mockRedisClient.sIsMember.mockResolvedValueOnce(false);
      const [error, status] = await userRoomService.setUserVoted(
        "room123",
        "user1",
      );

      expect(error).toBeInstanceOf(Error);
      expect(status).toBe(404);
    });
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
    it("should return voted users", async () => {
      const [error, users, status] =
        await userRoomService.getVotedUsers("room123");
      expect(error).toBeNull();
      expect(users).toEqual(["user1", "user2"]);
      expect(status).toBe(200);
    });

    it("should return empty when no one voted", async () => {
      mockRedisClient.sMembers.mockResolvedValueOnce([]);
      const [error, users, status] =
        await userRoomService.getVotedUsers("room123");
      expect(error).toBeNull();
      expect(users).toEqual([]);
      expect(status).toBe(200);
    });
  });
});
