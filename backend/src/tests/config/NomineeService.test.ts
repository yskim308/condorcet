import { describe, it, expect, beforeEach, mock } from "bun:test";
import nomineeService from "../../config/NomineeService";

const mockRedisClient = {
  set: mock(async (key: string, value: any) => {}),
  get: mock(async (key: string) => "1"),
  incr: mock(async (key: string) => 1),
  hset: mock(async (key: string, field: string, value: any) => {}),
  hGetAll: mock(async (key: string) => ({ "1": "John Doe" })),
  lPush: mock(async (key: string, value: any) => {}),
  lRange: mock(async (key: string, start: number, stop: number) => [
    JSON.stringify(["John Doe"]),
  ]),
};

mock.module("../../config/redisClient", () => ({
  __esModule: true,
  redisClient: mockRedisClient,
}));

describe("NomineeService", () => {
  beforeEach(() => {
    mockRedisClient.set.mockClear();
    mockRedisClient.get.mockClear();
    mockRedisClient.incr.mockClear();
    mockRedisClient.hset.mockClear();
    mockRedisClient.hGetAll.mockClear();
    mockRedisClient.lPush.mockClear();
    mockRedisClient.lRange.mockClear();
  });

  describe("setNomineeCount", () => {
    it("should set nominee count successfully", async () => {
      const [error, status] = await nomineeService.setNomineeCount("room123");

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "room:room123:nominee_count",
        -1,
      );
    });

    it("should return an error if redis fails", async () => {
      mockRedisClient.set.mockRejectedValueOnce(new Error("Redis error"));
      const [error, status] = await nomineeService.setNomineeCount("room123");

      expect(error).toBeInstanceOf(Error);
      expect(status).toBe(500);
    });
  });

  describe("getNomineeCount", () => {
    it("should get nominee count successfully", async () => {
      const [error, count, status] = await nomineeService.getNomineeCount(
        "room123",
      );

      expect(error).toBeNull();
      expect(count).toBe(1);
      expect(status).toBe(200);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        "room:room123:nominee_count",
      );
    });

    it("should return an error if redis fails", async () => {
      mockRedisClient.get.mockRejectedValueOnce(new Error("Redis error"));
      const [error, count, status] = await nomineeService.getNomineeCount(
        "room123",
      );

      expect(error).toBeInstanceOf(Error);
      expect(count).toBeNull();
      expect(status).toBe(500);
    });
  });

  describe("addNominee", () => {
    it("should add a nominee successfully", async () => {
      const [error, status] = await nomineeService.addNominee(
        "room123",
        "John Doe",
      );

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(mockRedisClient.incr).toHaveBeenCalledWith(
        "room:room123:nominee_count",
      );
      expect(mockRedisClient.hset).toHaveBeenCalledWith(
        "room:room123:nominees",
        1,
        "John Doe",
      );
    });

    it("should return an error if redis fails", async () => {
      mockRedisClient.incr.mockRejectedValueOnce(new Error("Redis error"));
      const [error, status] = await nomineeService.addNominee(
        "room123",
        "John Doe",
      );

      expect(error).toBeInstanceOf(Error);
      expect(status).toBe(500);
    });
  });

  describe("getAllNominees", () => {
    it("should get all nominees successfully", async () => {
      const [error, nominees, status] = await nomineeService.getAllNominees(
        "room123",
      );

      expect(error).toBeNull();
      expect(nominees).toEqual({ "1": "John Doe" });
      expect(status).toBe(200);
      expect(mockRedisClient.hGetAll).toHaveBeenCalledWith(
        "room:room123:nominees",
      );
    });

    it("should return an error if redis fails", async () => {
      mockRedisClient.hGetAll.mockRejectedValueOnce(new Error("Redis error"));
      const [error, nominees, status] = await nomineeService.getAllNominees(
        "room123",
      );

      expect(error).toBeInstanceOf(Error);
      expect(nominees).toBeNull();
      expect(status).toBe(500);
    });
  });

  describe("saveVote", () => {
    it("should save a vote successfully", async () => {
      const [error, status] = await nomineeService.saveVote("room123", [
        "John Doe",
      ]);

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(mockRedisClient.lPush).toHaveBeenCalledWith(
        "room:room123:votes",
        JSON.stringify(["John Doe"]),
      );
    });

    it("should return an error if redis fails", async () => {
      mockRedisClient.lPush.mockRejectedValueOnce(new Error("Redis error"));
      const [error, status] = await nomineeService.saveVote("room123", [
        "John Doe",
      ]);

      expect(error).toBeInstanceOf(Error);
      expect(status).toBe(500);
    });
  });

  describe("getAllVotes", () => {
    it("should get all votes successfully", async () => {
      const [error, votes, status] = await nomineeService.getAllVotes("room123");

      expect(error).toBeNull();
      expect(votes).toEqual([["John Doe"]]);
      expect(status).toBe(200);
      expect(mockRedisClient.lRange).toHaveBeenCalledWith(
        "room:room123:votes",
        0,
        -1,
      );
    });

    it("should return an error if redis fails", async () => {
      mockRedisClient.lRange.mockRejectedValueOnce(new Error("Redis error"));
      const [error, votes, status] = await nomineeService.getAllVotes("room123");

      expect(error).toBeInstanceOf(Error);
      expect(votes).toBeNull();
      expect(status).toBe(500);
    });
  });
});