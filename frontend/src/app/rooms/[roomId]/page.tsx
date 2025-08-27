"use client";
import { useParams, useRouter } from "next/navigation";
import { fetchRoomData } from "@/lib/data-fetch";
import { useQuery } from "@tanstack/react-query";
import { useSocketStore } from "@/stores/socket-store";
import { useRoleStore } from "@/stores/role-store";
import { useEffect } from "react";
import ChatContainer from "@/components/chat/chat-container";
import NominationPage from "@/components/stage-pages/nomination-page";
import { useRoomStore } from "@/stores/room-store";

export default function RoomPage() {
  const { roomId } = useParams();
  const userName = useRoomStore((state) => state.userName);
  const router = useRouter();
  const { setUsers, setState, setNominations, setVotedUsers, setWinner } =
    useSocketStore((state) => ({
      setUsers: state.setUsers,
      setState: state.setState,
      setNominations: state.setNominations,
      setVotedUsers: state.setVotedUsers,
      setWinner: state.setWinner,
    }));
  const state = useSocketStore((state) => state.state);
  const roleStore = useRoleStore();

  if (!userName) {
    router.push("/?error=user_does_not_exist");
    return;
  }

  const query = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoomData(roomId as string, userName!),
    enabled: !!roomId && !!userName,
  });

  useEffect(() => {
    if (!query.isSuccess || !query.data) return;
    if (query.data.role === "host") roleStore.setHost();
    setUsers(query.data.users);
    setState(query.data.state);
    setNominations(query.data.nominations);
    query.data?.votedUsers && setVotedUsers(query.data.votedUsers);
    query.data?.winner && setWinner(query.data.winner);
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
      {state == "nominating" && <NominationPage />}
    </>
  );
}
