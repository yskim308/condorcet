import { useSocketStore } from "@/stores/socket-store";
import { useEffect, ReactNode } from "react";

export default function SocketManager({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
