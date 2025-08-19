import { useSocketStore } from "@/stores/socket-store";
import ChatMessage from "./chat-message";
import ChatInput from "./chat-input";

export default function ChatContainer() {
  const socketStore = useSocketStore();
  return (
    <div>
      <h1>chat header</h1>
      {socketStore.messages.map((message) => (
        <ChatMessage {...message} />
      ))}
      <ChatInput />
    </div>
  );
}
