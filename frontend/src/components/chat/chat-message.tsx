import type { Message } from "@/types/socket-store-types";

export default function ChatMessage(message: Message) {
  return (
    <div className="flex flex-col">
      <div>Username: {message.userName}</div>
      <div>Message {message.message}</div>
    </div>
  );
}
