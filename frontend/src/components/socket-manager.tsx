"use client";
import { useSocketStore } from "@/stores/socket-store";
import { useEffect } from "react";
import socket from "@/socket-config/socket";
import type { Message } from "@/types/socket-store-types";

export default function SocketManager({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const socketStore = useSocketStore();
  useEffect(() => {
    socket.on("connect", () => {
      socketStore.connect();
    });
    socket.on(
      "new-nomination",
      (payload: { nominee: string; roomId: string }) => {
        socketStore.addToNominationList(payload.nominee);
      },
    );
    socket.on("state-change", (payload: { state: string; roomId: string }) => {
      socketStore.setState(payload.state);
    });
    socket.on("new-user", (payload: { userName: string; roomId: string }) => {
      socketStore.addUser(payload.userName);
    });
    socket.on("user-voted", (payload: { userName: string }) => {
      socketStore.addVotedUser(payload.userName);
    });
    socket.on("new-message", (payload: Message) => {
      socketStore.addMessage(payload);
    });
    socket.on("winner", (payload: string) => {
      socketStore.setWinner(payload);
    });

    return () => {
      socket.off("connect");
      socket.off("new-nomination");
      socket.off("state-change");
      socket.off("new-user");
      socket.off("user-voted");
      socket.off("new-message");
      socket.off("winner");
    };
  }, []);
  return <>{children}</>;
}
