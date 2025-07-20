import type { RedisClientType } from "redis";
import { getErrorMessage, getRedisError } from "../util/getErrorMessage";
import type { NomineeMap } from "../types/nominee";
import findWinner from "../util/findWinner";

export default class NomineeService {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }
  async setNomineeCount(roomId: string): Promise<[Error | null, number]> {
    try {
      await this.redisClient.set(`room:${roomId}:nominee_count`, -1);
      return [null, 200];
    } catch (error: unknown) {
      console.error("error setting nominee count: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }

  async getNomineeCount(
    roomId: string,
  ): Promise<[Error | null, number | null, number]> {
    try {
      const count = await this.redisClient.get(`room:${roomId}:nominee_count`);
      if (!count) {
        return [null, null, 200];
      }
      return [null, parseInt(count), 200];
    } catch (error: unknown) {
      console.error("error getting nominee count: " + getErrorMessage(error));
      const [err, code] = getRedisError(error);
      return [err, null, code];
    }
  }

  async addNominee(
    roomId: string,
    nominee: string,
  ): Promise<[Error | null, number]> {
    try {
      const nominee_id = await this.redisClient.incr(
        `room:${roomId}:nominee_count`,
      );
      await this.redisClient.hSet(
        `room:${roomId}:nominees`,
        nominee_id,
        nominee,
      );
      return [null, 200];
    } catch (error: unknown) {
      console.error("error adding nominee: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }

  async getAllNominees(
    roomId: string,
  ): Promise<[Error | null, NomineeMap | null, number]> {
    try {
      // HGETALL returns an object where keys are fields and values are their corresponding values.
      const nominees: NomineeMap = await this.redisClient.hGetAll(
        `room:${roomId}:nominees`,
      );

      return [null, nominees, 200];
    } catch (error: unknown) {
      console.error("error getting all nominees: " + getErrorMessage(error));
      // Depending on your error handling, you might return a specific error type;
      const [err, code] = getRedisError(error);
      return [err, null, code];
    }
  }

  async saveVote(
    roomId: string,
    preferences: string[],
  ): Promise<[Error | null, number]> {
    try {
      // Serialize the array to a JSON string to preserve its structure
      const serializedPreferences = JSON.stringify(preferences);
      await this.redisClient.lPush(
        `room:${roomId}:votes`,
        serializedPreferences,
      );
      return [null, 200];
    } catch (error: unknown) {
      console.error(
        "Error saving voting preferences: " + getErrorMessage(error),
      );
      return getRedisError(error);
    }
  }

  async getAllVotes(
    roomId: string,
  ): Promise<[Error | null, string[][] | null, number]> {
    try {
      const votesAsJson = await this.redisClient.lRange(
        `room:${roomId}:votes`,
        0,
        -1,
      );
      if (!votesAsJson) {
        return [null, [], 200]; // Return empty array if no votes
      }
      // Parse each JSON string back into an array of strings
      const votes = votesAsJson.map((vote) => JSON.parse(vote));
      return [null, votes, 200];
    } catch (error: unknown) {
      console.error("error getting all votes: " + getErrorMessage(error));
      const [err, code] = getRedisError(error);
      return [err, null, code];
    }
  }

  async findWinner(roomId: string): Promise<[Error | null, string, number]> {
    try {
      // get votes
      const [voteErr, votes, voteCode] = await this.getAllVotes(roomId);
      if (voteErr) {
        return [voteErr, "", voteCode];
      }
      if (!votes) {
        return [new Error("no votes recorded"), "", 500];
      }

      // get nominee count
      const nomineeCount = await this.redisClient.get(
        `room:${roomId}:nominee_count`,
      );
      if (!nomineeCount) {
        return [new Error("nominee count not initialized"), "", 500];
      }

      // find winner with util, then set in redis
      const winnerId = findWinner(votes, parseInt(nomineeCount));

      // get the nominee map to find winner string
      const nomineeMap = await this.redisClient.hGetAll(
        `room:${roomId}:nominees`,
      );
      const winner: string = nomineeMap[winnerId];
      if (!winner) {
        return [new Error("winner Id not defined in map"), "", 500];
      }

      await this.redisClient.hSet(`room:${roomId}`, "winnerId", winnerId);
      await this.redisClient.hSet(`room:${roomId}`, "winnerName", winner);
      return [null, winner, 200];
    } catch (error: unknown) {
      console.error("error when determinig winner: " + getErrorMessage(error));
      const [err, code] = getRedisError(error);
      return [err, "", code];
    }
  }

  async getWinner(roomId: string): Promise<[Error | null, string, number]> {
    try {
      const winner = await this.redisClient.hGet(
        `room:${roomId}`,
        "winnerName",
      );
      if (!winner) {
        return [new Error("no winner was set"), "", 401];
      } else {
        return [null, winner, 200];
      }
    } catch (error: unknown) {
      console.error("error when getting winner: " + getErrorMessage(error));
      const [err, code] = getRedisError(error);
      return [err, "", code];
    }
  }
}
