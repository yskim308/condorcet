import { createRoom, joinRoom } from "@/lib/room-service";
import type {
  CreateRoomReponse,
  CreateRoomPayload,
  JoinRoomPayload,
} from "@/lib/room-service";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRoomStore } from "@/stores/room-store";
import axios from "axios";

export default function useRoomActions() {
  const router = useRouter();
  const setUserName = useRoomStore((state) => state.setUserName);
  const setHostKey = useRoomStore((state) => state.setHostKey);
  const setRoomId = useRoomStore((state) => state.setRoomId);

  const onCreateSuccess = (
    hostKey: string,
    userName: string,
    roomId: string,
  ) => {
    setHostKey(hostKey);
    setUserName(userName);
    setRoomId(roomId);
    router.push(`/rooms/${roomId}`);
  };

  const onJoinSuccess = (userName: string, roomId: string) => {
    setUserName(userName);
    setRoomId(roomId);
    router.push(`/rooms/${roomId}`);
  };

  const onError = (action: "join" | "create", error: unknown) => {
    let errorMessage = "error while trying to ";
    errorMessage += action === "join" ? "join room:" : "create room: ";

    if (axios.isAxiosError(error)) {
      errorMessage += error.response?.data?.error;
    } else if (error instanceof Error) {
      errorMessage += error.message;
    }

    toast.error(errorMessage);
  };
  const createMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (data: CreateRoomReponse, variables: CreateRoomPayload, _) => {
      const { hostKey, roomId } = data;
      const { userName } = variables;
      onCreateSuccess(hostKey, userName, roomId);
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
