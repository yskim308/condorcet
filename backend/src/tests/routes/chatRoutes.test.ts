import { beforeEach, describe, expect, it, mock } from "bun:test";
import express from "express";
import request from "supertest";
import type { Message } from "../../types/chat";
import { createChatRouter } from "../../routes/chatRoutes";

const exampleRoom = "room123";

const exampleMessage: Message = {
  userName: "exampleUser",
  message: "message from example user",
};

const exampleMessageList: Message[] = [
  {
    userName: "user1",
    message: "message from user1",
  },
  {
    userName: "user2",
    message: "message from user2",
  },
  {
    userName: "user3",
    message: "message from user3",
  },
];

const createMockSocketService = () => ({
  emitNewMessage: mock(
    (roomId: string, userName: string, message: string) => {},
  ),
});

const createMockChatService = () => ({
  getAllMessages: mock(async (roomId): Promise<any> => exampleMessageList),
  sendMessage: mock(
    async (
      roomId: string,
      userName: string,
      message: string,
    ): Promise<any> => {},
  ),
});

describe("chat-routes", () => {
  let app: express.Application;
  let mockSocketService: ReturnType<typeof createMockSocketService>;
  let mockChatService: ReturnType<typeof createMockChatService>;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockSocketService = createMockSocketService();
    mockChatService = createMockChatService();
    const chatRouter = createChatRouter(
      mockSocketService as any,
      mockChatService as any,
    );
    app.use(chatRouter);
    app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        res.status(500).json({ error: err.message });
      },
    );
  });

  describe("GET /rooms/:roomId/message/getAll", () => {
    it("should get all messages succesfully", async () => {
      const response = await request(app).get(
        `/rooms/${exampleRoom}/message/getAll`,
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual(exampleMessageList);
    });
  });
});
