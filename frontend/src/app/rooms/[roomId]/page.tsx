"use client";
import { useParams, useRouter } from "next/navigation";
import { fetchRoomData } from "@/lib/data-fetch";
import { useQuery } from "@tanstack/react-query";
import { useSocketStore } from "@/stores/socket-store";
import { useRoleStore } from "@/stores/role-store";
import { useEffect, useState } from "react";
import ChatContainer from "@/components/chat/chat-container";
import NominationPage from "@/components/stage-pages/nomination-page";
import { useRoomStore } from "@/stores/room-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomInfo from "@/components/room-info";

export default function RoomPage() {
  const { roomId } = useParams();
  const userName = useRoomStore((state) => state.userName);
  const router = useRouter();
  const state = useSocketStore((state) => state.state);
  const roleStore = useRoleStore();

  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!userName) {
      router.push("/?error=user_does_not_exist");
      return;
    }
  }, [userName, isHydrated]);

  const query = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoomData(roomId as string, userName!),
    enabled: !!roomId && !!userName,
  });

  useEffect(() => {
    if (!query.isSuccess || !query.data) return;

    const {
      setUsers,
      setState,
      setNominationMap,
      setVotedUsers,
      setWinner,
      setNominationList,
    } = useSocketStore.getState();
    if (query.data.role === "host") roleStore.setHost();
    setUsers(query.data.users);
    setState(query.data.state);
    if (query.data.nominations) {
      setNominationMap(query.data.nominations);
      setNominationList(query.data.nominations);
    } else {
      setNominationMap({});
      setNominationList({});
    }
    query.data?.votedUsers && setVotedUsers(query.data.votedUsers);
    query.data?.winner && setWinner(query.data.winner);
  }, [query.isSuccess, query.data]);

  useEffect(() => {
    if (query.isError) {
      router.push("/?error=room_not_found");
      return;
    }
  }, [query.isError]);

  if (query.isPending) {
    return <h1>loading...</h1>;
  }

  return (
    <>
      <Tabs defaultValue="voting-page" className="flex flex-col h-full">
        <div className="flex justify-center mt-5">
          <TabsList>
            <TabsTrigger value="voting-page">Voting Page</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
          <RoomInfo />
        </div>
        <TabsContent value="voting-page">
          {state == "nominating" && <NominationPage />}
        </TabsContent>
        <TabsContent value="chat" asChild>
          <ChatContainer roomId={roomId as string} />
        </TabsContent>
      </Tabs>
    </>
  );
}
