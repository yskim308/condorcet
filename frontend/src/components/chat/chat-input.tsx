"use client";
import useChatActions from "@/hooks/use-chat-actions";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ChangeEvent, useState } from "react";
import { useParams } from "next/navigation";
import { Send } from "lucide-react";

interface ChatInputProps {
  userName: string;
}

export default function ChatInput({ userName }: ChatInputProps) {
  const [input, setInput] = useState<string>("");
  const { roomId } = useParams();
  const { handleSendMessage, isLoading } = useChatActions();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    handleSendMessage({
      roomId: roomId as string,
      userName: userName,
      message: input,
    });
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <Input
        onChange={handleInputChange}
        value={input}
        onKeyDown={handleKeyPress}
        placeholder="Type your message..."
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!input.trim() || isLoading}
        size="icon"
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </>
  );
}
