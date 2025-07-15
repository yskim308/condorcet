import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";

// service imports
import SocketService from "./config/SocketService";
import NomineeService from "./config/NomineeService";
import UserRoomService from "./config/UserRoomService";
import RoomService from "./config/RoomService";
import { createVerifyHostMiddleware } from "./middleware/verifyHost";
import { redisClient } from "./config/redisClient";
import { createHostRouter } from "./routes/hostRoutes";
import { createParticipantRouter } from "./routes/participantRoutes";

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

app.use(cors());
app.use(express.json());
app.use("/host", hostRoutes);
app.use("/participant", participantRoutes);

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("<h1>Hello world</h1>");
});

server.listen(port, () => {
  console.log(`lisetning on port: ${port}`);
});
