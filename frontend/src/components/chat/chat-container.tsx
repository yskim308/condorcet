"use client";
import { useSocketStore } from "@/stores/socket-store";
import ChatMessage from "./chat-message";
import ChatInput from "./chat-input";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { getALlMessages } from "@/lib/chat-service";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatContainerProps {
  roomId: string;
  userName: string;
}

export default function ChatContainer({
  roomId,
  userName,
}: ChatContainerProps) {
  const messages = useSocketStore((state) => state.messages);
  const setMessages = useSocketStore((state) => state.setMessages);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const messageQuery = useQuery({
    queryKey: ["messages", roomId],
    queryFn: () => getALlMessages(roomId),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // setting messages on send
  useEffect(() => {
    if (!messageQuery.isSuccess || !messageQuery.data) return;
    setMessages(messageQuery.data);
  }, [messageQuery.isSuccess, messageQuery.data]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Card className="flex flex-col h-full max-h-[600px] bg-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          Chat
        </CardTitle>
        <Separator />
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full max-h-[400px]">
          <div className="space-y-1">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p className="text-sm">
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))
            )}
            <div ref={messageEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <div className="p-4 pt-0">
        <Separator className="mb-4" />
        <div className="flex gap-2">
          <ChatInput userName={userName} />
        </div>
      </div>
    </Card>
  );
}
