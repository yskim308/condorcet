import socket from "@/socket-config/socket";
import axios from "axios";

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!backendBase) {
  throw new Error("NEXT_PUBLIC_BACKEND_BASE not set in .env");
}

const apiClient = axios.create({
  baseURL: backendBase,
});

export interface CreateRoomReponse {
  roomId: string;
  hostKey: string;
}

export interface CreateRoomPayload {
  roomName: string;
  userName: string;
}

export interface JoinRoomPayload {
  roomId: string;
  userName: string;
}

export const createRoom = async (
  payload: CreateRoomPayload,
): Promise<CreateRoomReponse> => {
  const response = await apiClient.post<CreateRoomReponse>(
    "/rooms/create",
    payload,
  );
  socket.emit("join-room", response.data.roomId);
  return response.data;
};

export const joinRoom = async (payload: JoinRoomPayload): Promise<void> => {
  await apiClient.post("/room/join", payload);
  socket.emit("join-room", payload.roomId);
};
