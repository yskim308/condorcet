import express from "express";
import ChatService from "../config/ChatService";
import type SocketService from "../config/SocketService";
import type { Message } from "../types/chat";

export const createChatRouter = (
  socketSerivce: SocketService,
  chatService: ChatService,
) => {
  const router = express.Router();
  router.get(
    "/rooms/:roomId/message/getAll",
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        const { roomId } = req.params;
        const messages: Message[] = await chatService.getAllMessages(roomId);
        res.status(200).send(messages);
      } catch (error) {
        next(error);
      }
    },
  );

  interface SendMessageBody {
    userName: string;
    message: string;
  }
  router.post(
    "/rooms/:roomId/message/sendMessage",
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        const { roomId } = req.params;
        const { userName, message }: SendMessageBody = req.body;
        socketSerivce.emitNewMessage(roomId, userName, message);
        await chatService.sendMessage(roomId, userName, message);
        res
          .status(200)
          .json({ message: `message sent succesfully to room:${roomId}` });
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
};
