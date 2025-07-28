import type express from "express";
import type RoomService from "../config/RoomService";

export type CreateVerifyHostMiddleware = (
  roomService: RoomService,
) => (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => Promise<void>;

export const createVerifyHostMiddleware: CreateVerifyHostMiddleware = (
  roomService,
) => {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { roomId } = req.params;
      const { hostKey } = req.body;

      if (!hostKey) {
        res.status(401).json({ error: "no host key provided" });
        return;
      }

      const roomHostKey = await roomService.getHostKey(roomId);

      if (hostKey !== roomHostKey) {
        res.status(403).json({ error: "invalid host key" });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: "host key verification failed" });
      return;
    }
  };
};
