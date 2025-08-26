"use client";
import { useSocketStore } from "@/stores/socket-store";
import ChatMessage from "./chat-message";
import ChatInput from "./chat-input";
import { useQuery } from "@tanstack/react-query";
import { getALlMessages } from "@/lib/chat-service";
import { useEffect } from "react";

interface ChatContainerProps {
  roomId: string;
  userName: string;
}
export default function ChatContainer({
  roomId,
  userName,
}: ChatContainerProps) {
  const messageQuery = useQuery({
    queryKey: ["messages", roomId],
    queryFn: () => getALlMessages(roomId),
  });
  const { setMessages, messages } = useSocketStore();

  useEffect(() => {
    if (!messageQuery.isSuccess || !messageQuery.data) return;
    setMessages(messageQuery.data);
  }, [messageQuery.isSuccess, messageQuery.data]);

  return (
    <div>
      <h1>chat header</h1>
      {messages.map((message, index) => (
        <ChatMessage key={index} message={message} />
      ))}
      <ChatInput userName={userName} />
    </div>
  );
}
