import { describe, it, expect, beforeEach, mock } from "bun:test";
import UserRoomService from "../../config/UserRoomService";

const HOST_USER = "user1";
const USER = "user2";
const VOTED_USERS = ["user1", "user2"];

const createMockRedisClient = () => ({
  sAdd: mock(async (key: string, value: any) => 1),
  sIsMember: mock(async (key: string, value: any) => 1),
  sMembers: mock(async (key: string) => VOTED_USERS),
  hGet: mock(async (key: string, field: string) => HOST_USER),
  expire: mock(async (key: string, ttl: number) => {}),
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
      await userRoomService.enrollUser("room123", "user1");

      expect(mockRedisClient.sAdd).toHaveBeenCalledWith(
        "room:room123:users",
        "user1",
      );
    });

    it("should return true if user exists", async () => {
      const exists = await userRoomService.userExists("room123", "user1");

      expect(exists).toBe(true);
      expect(mockRedisClient.sIsMember).toHaveBeenCalledWith(
        "room:room123:users",
        "user1",
      );
    });

    it("should return false if user does not exist", async () => {
      mockRedisClient.sIsMember.mockResolvedValueOnce(0);
      const exists = await userRoomService.userExists("room123", "user1");

      expect(exists).toBe(false);
    });

    it("should get all users successfully", async () => {
      const users = await userRoomService.getUsers("room123");

      expect(users).toEqual(["user1", "user2"]);
      expect(mockRedisClient.sMembers).toHaveBeenCalledWith(
        "room:room123:users",
      );
    });

    it("should return host if the user is host", async () => {
      const role = await userRoomService.getRole("room123", HOST_USER);
      expect(role).toBe("host");
    });

    it("should return user otherwise", async () => {
      const role = await userRoomService.getRole("room123", USER);
      expect(role).toBe("user");
    });
  });

  describe("user voting", () => {
    it("should set user as voted successfully", async () => {
      await userRoomService.setUserVoted("room123", "user1");

      expect(mockRedisClient.sAdd).toHaveBeenCalledWith(
        "room:room123:voted",
        "user1",
      );
    });
    it("should throw an error if user does not exist when setting voted", async () => {
      mockRedisClient.sIsMember.mockResolvedValueOnce(0);
      await expect(userRoomService.setUserVoted("room123", "user1")).rejects.toThrow(
        "User user1 does not exist in room room123",
      );
    });
    it("should return true if user has voted", async () => {
      const voted = await userRoomService.checkUserVoted("room123", "user1");

      expect(voted).toBe(true);
      expect(mockRedisClient.sIsMember).toHaveBeenCalledWith(
        "room:room123:voted",
        "user1",
      );
    });

    it("should return false if user has not voted", async () => {
      mockRedisClient.sIsMember.mockResolvedValueOnce(0);
      const voted = await userRoomService.checkUserVoted("room123", "user1");

      expect(voted).toBe(false);
    });
    it("should return voted users", async () => {
      const users = await userRoomService.getVotedUsers("room123");
      expect(users).toEqual(["user1", "user2"]);
    });

    it("should return empty when no one voted", async () => {
      mockRedisClient.sMembers.mockResolvedValueOnce([]);
      const users = await userRoomService.getVotedUsers("room123");
      expect(users).toEqual([]);
    });
  });
});
