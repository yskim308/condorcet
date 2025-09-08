import { useRoomStore } from "@/stores/room-store";
import { useSocketStore } from "@/stores/socket-store";

export default function RoomInfo() {
  const roomId = useRoomStore((state) => state.roomId);
  const votingStage = useSocketStore((state) => state.state);

  return (
    <>
      <div className="flex">
        <div>
          <h1>State: {votingStage}</h1>
        </div>
        <div>
          <h1>roomId: {roomId}</h1>
        </div>
      </div>
    </>
  );
}
