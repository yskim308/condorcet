import { describe, it, expect, beforeEach, mock } from "bun:test";
import UserRoomService from "../../config/UserRoomService";

const mockRedisClient = {
  sAdd: mock(async (key: string, value: any) => {}),
  sIsMember: mock(async (key: string, value: any) => {}),
  sMembers: mock(async (key: string) => {})
};

mock.module("../../config/redisClient", () => ({
  __esModule: true,
  redisClient: mockRedisClient,
}));

describe("UserRoomService", () => {
  let userRoomService: UserRoomService;

  beforeEach(() => {
    userRoomService = new UserRoomService();
    mockRedisClient.sAdd.mockImplementation(async (key: string, value: any) => {});
    mockRedisClient.sIsMember.mockImplementation(async (key: string, value: any) => true);
    mockRedisClient.sMembers.mockImplementation(async (key: string) => []);
  });

  it("should enroll a user in a room", async () => {
    const [error, status] = await userRoomService.enrollUser(
      "room123",
      "Test User",
    );

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(mockRedisClient.sAdd).toHaveBeenCalledWith(
      "room:room123:users",
      "Test User",
    );
  });

  it("should handle errors when enrolling a user", async () => {
    const errorMessage = "Redis error";
    mockRedisClient.sAdd.mockRejectedValue(new Error(errorMessage));

    const [error, status] = await userRoomService.enrollUser(
      "room123",
      "Test User",
    );

    expect(error).not.toBeNull();
    expect(error?.message).toBe(errorMessage);
    expect(status).toBe(500);
  });

  it("should check if a user exists", async () => {
    mockRedisClient.sIsMember.mockResolvedValue(true);

    const [error, exists, status] = await userRoomService.userExists(
      "room123",
      "Test User",
    );

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(exists).toBe(true);
    expect(mockRedisClient.sIsMember).toHaveBeenCalledWith(
      "room:room123:users",
      "Test User",
    );
  });

  it("should handle errors when checking if a user exists", async () => {
    const errorMessage = "Redis error";
    mockRedisClient.sIsMember.mockRejectedValue(new Error(errorMessage));

    const [error, exists, status] = await userRoomService.userExists(
      "room123",
      "Test User",
    );

    expect(error).not.toBeNull();
    expect(error?.message).toBe(errorMessage);
    expect(exists).toBe(false);
    expect(status).toBe(500);
  });

  it("should get all users in a room", async () => {
    const users = ["User 1", "User 2"];
    mockRedisClient.sMembers.mockResolvedValue(users);

    const [error, result, status] = await userRoomService.getUsers("room123");

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(result).toEqual(users);
    expect(mockRedisClient.sMembers).toHaveBeenCalledWith("room:room123:users");
  });

  it("should handle errors when getting users", async () => {
    const errorMessage = "Redis error";
    mockRedisClient.sMembers.mockRejectedValue(new Error(errorMessage));

    const [error, result, status] = await userRoomService.getUsers("room123");

    expect(error).not.toBeNull();
    expect(error?.message).toBe(errorMessage);
    expect(result).toEqual([]);
    expect(status).toBe(200); // The service returns 200 even on error, but with an error object
  });

  it("should set a user as voted", async () => {
    mockRedisClient.sIsMember.mockResolvedValue(true);

    const [error, status] = await userRoomService.setUserVoted(
      "room123",
      "Test User",
    );

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(mockRedisClient.sAdd).toHaveBeenCalledWith(
      "room:room123:voted",
      "Test User",
    );
  });

  it("should handle errors when setting a user as voted", async () => {
    const errorMessage = "Redis error";
    mockRedisClient.sIsMember.mockResolvedValue(true);
    mockRedisClient.sAdd.mockRejectedValue(new Error(errorMessage));

    const [error, status] = await userRoomService.setUserVoted(
      "room123",
      "Test User",
    );

    expect(error).not.toBeNull();
    expect(error?.message).toBe(errorMessage);
    expect(status).toBe(500);
  });

  it("should not set a user as voted if the user does not exist", async () => {
    mockRedisClient.sIsMember.mockResolvedValue(false);

    const [error, status] = await userRoomService.setUserVoted(
      "room123",
      "Test User",
    );

    expect(error).not.toBeNull();
    expect(error?.message).toBe("User Test User does not exist in room room123");
    expect(status).toBe(404);
  });

  it("should check if a user has voted", async () => {
    mockRedisClient.sIsMember.mockResolvedValue(true);

    const [error, voted, status] = await userRoomService.checkUserVoted(
      "room123",
      "Test User",
    );

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(voted).toBe(true);
    expect(mockRedisClient.sIsMember).toHaveBeenCalledWith(
      "room:room123:voted",
      "Test User",
    );
  });

  it("should handle errors when checking if a user has voted", async () => {
    const errorMessage = "Redis error";
    mockRedisClient.sIsMember.mockRejectedValue(new Error(errorMessage));

    const [error, voted, status] = await userRoomService.checkUserVoted(
      "room123",
      "Test User",
    );

    expect(error).not.toBeNull();
    expect(error?.message).toBe(errorMessage);
    expect(voted).toBe(false);
    expect(status).toBe(500);
  });
});
