import axios from "axios";

const backendBase = process.env.NEXT_PUBLIC_BACKEND_BASE;
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
  try {
    const response = await apiClient.post<CreateRoomReponse>(
      "/rooms/create",
      payload,
    );
    return response.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      throw new Error(e.response.data.message || "failed to create room");
    }
    throw new Error("network error while creaitng room");
  }
};

export const joinRoom = async (payload: JoinRoomPayload): Promise<void> => {
  try {
    await apiClient.post("/room/join", payload);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      throw new Error(e.response.data.message || "failed to join room");
    }
    throw new Error("network error while joining room");
  }
};
