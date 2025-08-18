import { createRoom, joinRoom } from "@/lib/room-service";
import type {
  CreateRoomReponse,
  CreateRoomPayload,
  JoinRoomPayload,
} from "@/lib/room-service";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

function onCreateSucces(hostKey: string, userName: string) {
  localStorage.setItem("hostKey", hostKey);
  localStorage.setItem("userName", userName);
}

function onJoinSuccess(userName: string) {
  localStorage.setItem("userName", userName);
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
      const { hostKey } = data;
      const { userName } = variables;
      onCreateSucces(hostKey, userName);
    },
    onError: (error, _, __) => {
      onError("create", error);
    },
  });

  const joinMutation = useMutation({
    mutationFn: joinRoom,
    onSuccess: (__, variables: JoinRoomPayload, _) => {
      const { userName } = variables;
      onJoinSuccess(userName);
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
