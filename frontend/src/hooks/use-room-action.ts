import { createRoom, joinRoom } from "@/lib/room-service";
import type {
  CreateRoomReponse,
  CreateRoomPayload,
  JoinRoomPayload,
} from "@/lib/room-service";
import { useMutation } from "@tanstack/react-query";

export default function useRoomState() {
  const handleCreate = useMutation({
    mutationFn: createRoom,
  });

  const handleJoin = useMutation({});
}
