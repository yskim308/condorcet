import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import SocketService from "./config/SocketService";
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

export const socketService = new SocketService(io);

const hostRoutes = createHostRouter(socketService);
const participantRoutes = createParticipantRouter(socketService);

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