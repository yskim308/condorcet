import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import { createClient } from "redis";
import { router as hostRoutes } from "./routes/hostRoutes";

const app = express();
const server = createServer(app);
const port = process.env.PORT;
if (!port) {
  throw new Error("port not defined in secrets");
}

export const redisClient = createClient({
  url: "redis://redis:6379",
});
redisClient.connect();

app.use(cors());
app.use(express.json());
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use("/host", hostRoutes);

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("<h1>Hello world</h1>");
});

io.on("connection", (socket: Socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", async (roomId: string) => {
    await socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

export { io };

server.listen(port, () => {
  console.log(`lisetning on port: ${port}`);
});
