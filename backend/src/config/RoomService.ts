import type { RedisClientType } from "redis";
import type { RoomData } from "../types/room";
import { TTL } from "./constants";
import { randomBytes } from "node:crypto";

class RoomService {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async createRoom(roomId: string, roomData: RoomData) {
    const key = `room:${roomId}`;
    await this.redisClient.hSet(key, { ...roomData });
    await this.redisClient.expire(key, TTL);
  }

  async findUniqueId(retries = 30): Promise<string> {
    for (let i = 0; i < retries; i++) {
      // 1. Generate a random ID
      const roomId = randomBytes(2).toString("hex");
      const key = `room:${roomId}`;

      // 2. Check if the key already exists in Redis
      // The `exists` command returns 1 if the key exists, 0 otherwise.
      const roomExists = await this.redisClient.exists(key);

      // 3. If the key does not exist (roomExists is 0), it's unique.
      if (!roomExists) {
        return roomId; // Return the unique ID
      }
    }

    // 4. If the loop completes, we failed to find a unique ID.
    throw new Error("Could not find a unique room ID after multiple attempts.");
  }

  async setVoting(roomId: string) {
    await this.redisClient.hSet(`room:${roomId}`, "state", "voting");
  }

  async setDone(roomId: string) {
    await this.redisClient.hSet(`room:${roomId}`, "state", "done");
  }

  async getState(roomId: string): Promise<string> {
    const roomState = await this.redisClient.hGet(`room:${roomId}`, "state");
    return roomState ? roomState : "";
  }

  async exists(roomId: string): Promise<boolean> {
    const roomExists = await this.redisClient.exists(`room:${roomId}`);
    return roomExists === 1 ? true : false;
  }

  async getHostKey(roomId: string): Promise<string> {
    const hostKey = await this.redisClient.hGet(`room:${roomId}`, "hostKey");
    return hostKey ? hostKey : "";
  }
}

export default RoomService;
