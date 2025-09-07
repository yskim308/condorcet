import axios from "axios";
import backendBase from "./backend-baseUrl";
import { NominationsMap } from "@/types/socket-store-types";

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
  return response.data;
}
