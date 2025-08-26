"use client";
import { useParams, useRouter } from "next/navigation";
import { fetchRoomData } from "@/lib/data-fetch";
import { useQuery } from "@tanstack/react-query";
import { useSocketStore } from "@/stores/socket-store";
import { useEffect } from "react";
import { useRoleStore } from "@/stores/role-store";
import { useState } from "react";
import ChatContainer from "@/components/chat/chat-container";

export default function RoomPage() {
  const { roomId } = useParams();
  const [userName, setUserName] = useState<string>("");
  const router = useRouter();
  const socketStore = useSocketStore();
  const roleStore = useRoleStore();

  useEffect(() => {
    console.log(roomId);
    const userName = localStorage.getItem("userName");
    if (!userName) {
      router.push("/?error=user_does_not_exist");
      return;
    }
    setUserName(userName);
  }, []);

  const query = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoomData(roomId as string, userName),
    enabled: !!roomId && !!userName,
  });

  useEffect(() => {
    if (!query.isSuccess || !query.data) return;
    if (query.data.role === "host") roleStore.setHost();
    socketStore.setUsers(query.data.users);
    socketStore.setState(query.data.state);
    socketStore.setNominations(query.data.nominations);
    query.data?.votedUsers && socketStore.setVotedUsers(query.data.votedUsers);
    query.data?.winner && socketStore.setWinner(query.data.winner);
  }, [query.isSuccess, query.data]);

  if (query.isError) {
    router.push("/?error=room_not_found");
    return;
  }
  if (query.isPending) {
    return <h1>loading...</h1>;
  }

  return (
    <>
      <ChatContainer roomId={roomId as string} userName={userName} />
    </>
  );
}
