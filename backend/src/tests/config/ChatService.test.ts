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
  lPush: mock(async (key: string, message: string) => {}),
  lRange: mock(async (key: string, start: number, stop: number) =>
    messageObjectList.map((message) => JSON.stringify(message)),
  ),
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
      expect(mockRedisClient.lPush).toHaveBeenCalledWith(
        exampleRoom,
        JSON.stringify(exampleMessage),
      );
    });

    it("should handle empty roomId", async () => {
      expect(
        await chatService.sendMessage(
          "",
          exampleMessage.userName,
          exampleMessage.message,
        ),
      ).rejects.toThrow();
    });

    it("should handle empty userNames", async () => {
      expect(
        await chatService.sendMessage(exampleRoom, "", exampleMessage.message),
      ).rejects.toThrow();
    });

    it("should handle empty messages", async () => {
      expect(
        await chatService.sendMessage(exampleRoom, exampleMessage.userName, ""),
      ).rejects.toThrow();
    });
  });
});
