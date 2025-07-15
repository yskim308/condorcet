export type RoomState = "nominating" | "voting" | "done";

export interface RoomData {
  name: string;
  state: RoomState;
  host: string;
  hostKey: string;
}
