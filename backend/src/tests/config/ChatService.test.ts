import { describe, it, expect, beforeEach, mock } from "bun:test";

import ChatService from "../../config/ChatService";
import type { Message } from "../../types/chat";

const exampleRoom = "room123";
const exampleMessage = {
  userName: "exampleUser",
  message: "message from example user",
};
const messageObjectList: Message[] = [
  {
    userName: "user1",
    message: "hello from user1",
  },
  {
    userName: "user2",
    message: "hello from user2",
  },
  {
    userName: "user3",
    message: "hello from user3",
  },
];
const createMockRedisCLient = () => ({
  rPush: mock(async (key: string, message: string) => {}),
  lRange: mock(async (key: string, start: number, stop: number) =>
    messageObjectList.map((message) => JSON.stringify(message)),
  ),
  expire: mock(async (key: string, ttl: number) => {}),
});

describe("ChatService", () => {
  let chatService: ChatService;
  let mockRedisClient: ReturnType<typeof createMockRedisCLient>;

  beforeEach(async () => {
    mockRedisClient = createMockRedisCLient();
    chatService = new ChatService(mockRedisClient as any);
  });

  describe("sendMessage", () => {
    it("should send message succesfully", async () => {
      await chatService.sendMessage(
        exampleRoom,
        exampleMessage.userName,
        exampleMessage.message,
      );

      expect(mockRedisClient.rPush).toHaveBeenCalledTimes(1);
      const [key, messageDataString] = mockRedisClient.rPush.mock.calls[0];
      const messageData = JSON.parse(messageDataString);

      expect(key).toBe(`room:${exampleRoom}:messages`);
      expect(messageData.userName).toBe(exampleMessage.userName);
      expect(messageData.message).toBe(exampleMessage.message);
    });

    it("should handle empty roomId", async () => {
      expect(
        chatService.sendMessage(
          "",
          exampleMessage.userName,
          exampleMessage.message,
        ),
      ).rejects.toThrow("roomId cannot be empty");
    });

    it("should handle empty userNames", async () => {
      expect(
        chatService.sendMessage(exampleRoom, "", exampleMessage.message),
      ).rejects.toThrow("userName cannot be empty");
    });

    it("should handle empty messages", async () => {
      expect(
        chatService.sendMessage(exampleRoom, exampleMessage.userName, ""),
      ).rejects.toThrow("message cannot be empty");
    });
  });

  describe("getMessages", () => {
    it("should get all messages succesfully", async () => {
      const messages = await chatService.getAllMessages(exampleRoom);
      expect(messages).toEqual(messageObjectList);
    });

    it("should throw an error if roomId is empty", async () => {
      expect(chatService.getAllMessages("")).rejects.toThrow(
        "roomId cannot be empty",
      );
    });
  });
});
