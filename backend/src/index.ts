import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import { router as hostRoutes } from "./routes/hostRoutes";
import { router as participantRoutes } from "./routes/participantRoutes";

const app = express();
const server = createServer(app);
const port = process.env.PORT;
if (!port) {
  throw new Error("port not defined in secrets");
}

app.use(cors());
app.use(express.json());
app.use("/host", hostRoutes);
app.use("/participant", participantRoutes);
export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

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

server.listen(port, () => {
  console.log(`lisetning on port: ${port}`);
});
