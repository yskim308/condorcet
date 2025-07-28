import type { RedisClientType } from "redis";
import { getErrorMessage, getRedisError } from "../util/getErrorMessage";
import { TTL } from "./constants";

class UserRoomService {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async enrollUser(roomId: string, userName: string) {
    const key = `room:${roomId}:users`;
    await this.redisClient.sAdd(key, userName);
    await this.redisClient.expire(key, TTL);
  }

  async userExists(roomId: string, userName: string): Promise<boolean> {
    const exists = await this.redisClient.sIsMember(
      `room:${roomId}:users`,
      userName,
    );
    return exists === 1 ? true : false;
  }

  async getUsers(roomId: string): Promise<string[]> {
    const members: string[] = await this.redisClient.sMembers(
      `room:${roomId}:users`,
    );
    return members;
  }

  async getRole(roomId: string, userName: string): Promise<string> {
    const roomHost = await this.redisClient.hGet(`room:${roomId}`, "host");
    return userName === roomHost ? "host" : "user";
  }

  async setUserVoted(roomId: string, userName: string) {
    const key = `room:${roomId}:voted`;
    const exists = await this.userExists(roomId, userName);
    if (!exists) {
      throw new Error(`User ${userName} does not exist in room ${roomId}`);
    }
    await this.redisClient.sAdd(key, userName);
    await this.redisClient.expire(key, TTL);
  }

  async getVotedUsers(roomId: string): Promise<string[]> {
    const votedUsers = await this.redisClient.sMembers(`room:${roomId}:voted`);
    return votedUsers ? votedUsers : [];
  }

  async checkUserVoted(roomId: string, userName: string): Promise<boolean> {
    const exists = await this.redisClient.sIsMember(
      `room:${roomId}:voted`,
      userName,
    );
    return exists === 1 ? true : false;
  }
}

export default UserRoomService;
