import { createRoom, joinRoom } from "@/lib/room-service";
import type {
  CreateRoomReponse,
  CreateRoomPayload,
  JoinRoomPayload,
} from "@/lib/room-service";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const router = useRouter();

function onCreateSucces(hostKey: string, userName: string, roomId: string) {
  localStorage.setItem("hostKey", hostKey);
  localStorage.setItem("userName", userName);
  router.push(`/rooms/${roomId}`);
}

function onJoinSuccess(userName: string, roomId: string) {
  localStorage.setItem("userName", userName);
  router.push(`/rooms/${roomId}`);
}

function onError(action: "join" | "create", error: unknown) {
  let errorMessage = "error while trying to ";
  action === "join" ? errorMessage + "join room" : errorMessage + "create room";
  if (error instanceof Error) {
    toast.error(errorMessage + error.message);
    return;
  }
  toast.error(errorMessage);
}

export default function useRoomState() {
  const createMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (data: CreateRoomReponse, variables: CreateRoomPayload, _) => {
      const { hostKey, roomId } = data;
      const { userName } = variables;
      onCreateSucces(hostKey, userName, roomId);
    },
    onError: (error, _, __) => {
      onError("create", error);
    },
  });

  const joinMutation = useMutation({
    mutationFn: joinRoom,
    onSuccess: (__, variables: JoinRoomPayload, _) => {
      const { userName, roomId } = variables;
      onJoinSuccess(userName, roomId);
    },
    onError: (error, _, __) => {
      onError("join", error);
    },
  });

  const isLoading = createMutation.isPending || joinMutation.isPending;
  return {
    handleCreateRoom: (payload: CreateRoomPayload) =>
      createMutation.mutate(payload),
    handleJoinRoom: (payload: JoinRoomPayload) => joinMutation.mutate(payload),
    isLoading,
  };
}
