"use client";
import { useParams, useRouter } from "next/navigation";
import { fetchRoomData } from "@/lib/data-fetch";
import { useQuery } from "@tanstack/react-query";
import { useSocketStore } from "@/stores/socket-store";
import { useEffect } from "react";
import { useRoleStore } from "@/stores/role-store";

export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const socketStore = useSocketStore();
  const roleStore = useRoleStore();

  const query = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoomData(roomId as string),
  });

  useEffect(() => {
    if (!query.isSuccess || !query.data) return;
    if (query.data.role === "host") roleStore.setHost();
    socketStore.setUsers(query.data.users);
    socketStore.setState(query.data.state);
    socketStore.setNominations(query.data.nominations);
    query.data?.votedUsers && socketStore.setVotedUsers(query.data.votedUsers);
    query.data?.winner && socketStore.setWinner(query.data.winner);
  });

  if (query.isError) {
    router.push("/?error=room_not_found");
  }
  if (query.isPending) {
    return <h1>loading...</h1>;
  }

  return <h1>hello</h1>;
}
