import { io, Socket } from "socket.io-client";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!backendURL) {
  throw new Error("error, backend url not set in .env");
}
interface ServerToClientEvents {
  "new-nomination": (payload: { nominee: string; roomId: string }) => void;
  "state-change": (payload: { state: string; roomId: string }) => void;
  "new-user": (payload: { userName: string; roomId: string }) => void;
  "user-voted": (payload: { userName: string }) => void;
  "new-message": (payload: { userName: string; message: string }) => void;
  winner: (winner: string) => void;
}

interface ClientToServerEvents {
  "join-room": (roomId: string) => void;
}
const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(backendURL);

export default socket;
