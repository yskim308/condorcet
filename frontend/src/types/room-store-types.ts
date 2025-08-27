export interface RoomStore {
  userName: string | null;
  hostKey: string | null;
  roomId: string | null;

  setUserName: (userName: string) => void;
  setHostKey: (hostKey: string) => void;
  setRoomId: (roomId: string) => void;
}
