import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";

// service imports
import SocketService from "./config/SocketService";
import NomineeService from "./config/NomineeService";
import UserRoomService from "./config/UserRoomService";
import RoomService from "./config/RoomService";
import ChatService from "./config/ChatService";
import { createVerifyHostMiddleware } from "./middleware/verifyHost";
import { redisClient } from "./config/redisClient";
import { createHostRouter } from "./routes/hostRoutes";
import { createParticipantRouter } from "./routes/participantRoutes";
import { createChatRouter } from "./routes/chatRoutes";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app = express();
const server = createServer(app);
const port = process.env.PORT;
if (!port) {
  throw new Error("port not defined in secrets");
}

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const socketService = new SocketService(io);
const roomService = new RoomService(redisClient);
const userRoomService = new UserRoomService(redisClient);
const nomineeService = new NomineeService(redisClient);
const chatService = new ChatService(redisClient);

const hostRoutes = createHostRouter(
  socketService,
  roomService,
  nomineeService,
  userRoomService,
  createVerifyHostMiddleware,
);

const participantRoutes = createParticipantRouter(
  socketService,
  userRoomService,
  roomService,
  nomineeService,
);

const chatRoutes = createChatRouter(socketService, chatService);

app.use(cors());
app.use(express.json());
app.use(hostRoutes);
app.use(participantRoutes);
app.use(chatRoutes);
app.use(globalErrorHandler);

server.listen(port, () => {
  console.log(`lisetning on port: ${port}`);
});
