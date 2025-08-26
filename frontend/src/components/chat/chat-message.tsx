import type { Message } from "@/types/socket-store-types";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className="flex flex-col gap-1 px-4 py-2 hover:bg-muted/30 transition-colors">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-sm text-foreground">
          {message.userName}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className="bg-muted/50 rounded-lg px-3 py-2 max-w-fit border">
        <p className="text-sm text-foreground break-words leading-relaxed">
          {message.message}
        </p>
      </div>
    </div>
  );
}
