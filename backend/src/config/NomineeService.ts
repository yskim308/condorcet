import type { RedisClientType } from "redis";
import { getErrorMessage, getRedisError } from "../util/getErrorMessage";
import type { NomineeMap } from "../types/nominee";
import findWinner from "../util/findWinner";
import { TTL } from "./constants";

export default class NomineeService {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }
  async setNomineeCount(roomId: string) {
    const key = `room:${roomId}:nominee_count`;
    await this.redisClient.set(key, -1);
    await this.redisClient.expire(key, TTL);
  }

  async getNomineeCount(roomId: string) {
    const count = await this.redisClient.get(`room:${roomId}:nominee_count`);
    if (!count) {
      return 0;
    }
    return parseInt(count);
  }

  async addNominee(roomId: string, nominee: string) {
    const key = `room:${roomId}:nominees`;
    const nominee_id = await this.redisClient.incr(
      `room:${roomId}:nominee_count`,
    );
    await this.redisClient.hSet(key, nominee_id, nominee);
    await this.redisClient.expire(key, TTL);
  }

  async getAllNominees(roomId: string): Promise<NomineeMap> {
    // HGETALL returns an object where keys are fields and values are their corresponding values.
    const nominees: NomineeMap = await this.redisClient.hGetAll(
      `room:${roomId}:nominees`,
    );
    if (!nominees) return {};
    return nominees;
  }

  async saveVote(roomId: string, preferences: string[]) {
    const key = `room:${roomId}:votes`;
    // Serialize the array to a JSON string to preserve its structure
    const serializedPreferences = JSON.stringify(preferences);
    await this.redisClient.lPush(key, serializedPreferences);
    await this.redisClient.expire(key, TTL);
  }

  async getAllVotes(roomId: string): Promise<string[][]> {
    const votesAsJson = await this.redisClient.lRange(
      `room:${roomId}:votes`,
      0,
      -1,
    );
    if (!votesAsJson) {
      return [[]];
    }
    // Parse each JSON string back into an array of strings
    const votes = votesAsJson.map((vote) => JSON.parse(vote));
    return votes;
  }

  async tallyVotes(roomId: string): Promise<string> {
    const votesAsJson = await this.redisClient.lRange(
      `room:${roomId}:votes`,
      0,
      -1,
    );
    // Parse each JSON string back into an array of strings
    const votes = votesAsJson.map((vote) => JSON.parse(vote));
    if (!votes || votes.length === 0) {
      throw new Error(`no recorded votes when tallying room ${roomId}`);
    }

    // get nominee count
    const nomineeCount = await this.redisClient.get(
      `room:${roomId}:nominee_count`,
    );
    if (!nomineeCount) {
      throw new Error(`nominee count not initialized in room ${roomId}`);
    }

    // find winner with util, then set in redis
    const winnerId = findWinner(votes, parseInt(nomineeCount));
    if (winnerId < 0) {
      throw new Error(`winnerID ${winnerId} not valid in room ${roomId}`);
    }

    // get the nominee map to find winner string
    const nomineeMap = await this.redisClient.hGetAll(
      `room:${roomId}:nominees`,
    );
    const winner: string = nomineeMap[String(winnerId)];
    if (!winner) {
      throw new Error(`winner Id not defined in map for ${roomId}`);
    }

    await this.redisClient.hSet(`room:${roomId}`, "winnerId", winnerId);
    await this.redisClient.hSet(`room:${roomId}`, "winnerName", winner);
    return winner;
  }

  async getWinner(roomId: string): Promise<string> {
    const winner = await this.redisClient.hGet(`room:${roomId}`, "winnerName");
    return winner ? winner : "";
  }
}
