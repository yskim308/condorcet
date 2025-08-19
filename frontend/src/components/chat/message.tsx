import type { Message } from "@/types/socket-store-types";

interface MessageProps {
  message: Message;
}
export default function Message({ message }: MessageProps) {
  return (
    <div className="flex flex-col">
      <div>{message.userName}</div>
      <div>{message.message}</div>
    </div>
  );
}
