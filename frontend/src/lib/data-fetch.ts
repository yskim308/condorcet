import axios from "axios";

interface RoomData {
  role: string;
  users: string[];
  state: string;
  nominations: string[];
  votedUsers?: string[];
  winner: string;
}

export async function fetchRoomData(roomId: string): Promise<RoomData | void> {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendBase) throw new Error("NEXT_PUBLIC_BACKEND_URL not set in .env");
  try {
    const response: RoomData = await axios.post(
      `${backendBase}/${roomId}/getRoomdData`,
    );
    return response;
  } catch (e: unknown) {
    return;
  }
}
