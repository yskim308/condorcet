import { io, Socket } from "socket.io-client";
import backendBase from "@/lib/backend-baseUrl";

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
  io(backendBase);

export default socket;
