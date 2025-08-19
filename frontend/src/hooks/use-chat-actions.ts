import { sendMessage, SendMessagePayload } from "@/lib/chat-service";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useChatActions() {
  const onSendError = (error: unknown) => {
    let errorMessage = "failed to send message";
    if (error instanceof Error) {
      errorMessage += ": " + error.message;
    }
    toast.error(errorMessage);
  };

  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onError: (error, __, ___) => onSendError(error),
  });

  const isLoading = sendMutation.isPending;
  return {
    handleSendMessage: (payload: SendMessagePayload) =>
      sendMutation.mutate(payload),
    isLoading,
  };
}
