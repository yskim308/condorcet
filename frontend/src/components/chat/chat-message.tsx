import type { Message } from "@/types/socket-store-types";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className="flex flex-col">
      <div>Username: {message.userName}</div>
      <div>Message {message.message}</div>
    </div>
  );
}
