"use client";
import { useSocketStore } from "@/stores/socket-store";
import ChatMessage from "./chat-message";
import ChatInput from "./chat-input";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatContainerProps {
  roomId: string;
  userName: string;
}

export default function ChatContainer({
  roomId,
  userName,
}: ChatContainerProps) {
  const { messages } = useSocketStore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
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
        <ScrollArea className="h-full max-h-[400px]" ref={scrollAreaRef}>
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
