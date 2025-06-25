import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";

const app = express();
const server = createServer(app);
const port = process.env.PORT;
if (!port) {
  throw new Error("port not defined in secrets");
}

app.use(cors());
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("<h1>Hello world</h1>");
});

server.listen(port, () => {
  console.log(`lisetning on port: ${port}`);
});

