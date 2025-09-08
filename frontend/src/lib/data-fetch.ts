import axios from "axios";
import backendBase from "./backend-baseUrl";
import { NominationsMap } from "@/types/socket-store-types";
import socket from "@/socket-config/socket";

interface RoomData {
  role: string;
  users: string[];
  state: string;
  nominations: NominationsMap;
  votedUsers?: string[];
  winner?: string;
}

export async function fetchRoomData(
  roomId: string,
  userName: string,
): Promise<RoomData> {
  const response = await axios.post<RoomData>(
    `${backendBase}/room/${roomId}/getRoomData`,
    {
      userName,
    },
  );
  socket.emit("join-room", roomId);
  return response.data;
}
