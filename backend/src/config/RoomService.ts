import type { RedisClientType } from "redis";
import { getErrorMessage, getRedisError } from "../util/getErrorMessage";
import type { RoomData } from "../types/room";
import { TTL } from "./constants";

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
