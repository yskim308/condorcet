import type { RedisClientType } from "@redis/client";
import { TTL } from "./constants";
import type { Message } from "../types/chat";

export default class ChatService {
  private redisClient: RedisClientType;
  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async sendMessage(roomId: string, userName: string, message: string) {
    const key = `$room:${roomId}:messages`;
    if (!roomId || roomId.trim() === "") {
      throw new Error("roomId cannot be empty");
    }
    if (!userName || userName.trim() === "") {
      throw new Error("userName cannot be empty");
    }
    if (!message) {
      throw new Error("message cannot be empty");
    }

    const messageObject: Message = { userName, message };
    const messageString = JSON.stringify(messageObject);
    await this.redisClient.lPush(key, messageString);
    await this.redisClient.expire(key, TTL);
  }

  async getAllMessages(roomId: string): Promise<Message[]> {
    if (!roomId || roomId.trim() === "") {
      throw new Error("roomId cannot be empty");
    }
    const key = `room:${roomId}:messages`;
    const messageStringList = await this.redisClient.lRange(key, 0, -1);
    return messageStringList.map(
      (messageString) => JSON.parse(messageString) as Message,
    );
  }
}
