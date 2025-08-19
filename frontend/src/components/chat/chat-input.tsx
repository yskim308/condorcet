"use client";
import useChatActions from "@/hooks/use-chat-actions";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { useParams } from "next/navigation";

interface ChatInputProps {
  userName: string;
}

export default function ChatInput({ userName }: ChatInputProps) {
  const [input, setInput] = useState<string>("");
  const { roomId } = useParams();
  const { handleSendMessage, isLoading } = useChatActions();
  const handleSubmit = () => {
    handleSendMessage({
      roomId: roomId as string,
      userName: userName,
      message: input,
    });
    setInput("");
  };

  return (
    <>
      <Input />
      <Button type="button" onClick={handleSubmit}>
        Submit
      </Button>
    </>
  );
}
