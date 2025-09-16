"use client";
import { toast } from "sonner";
import { ChangeEvent, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import useRoomActions from "@/hooks/use-room-action";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const [userName, setUserName] = useState<string>("");
  const [roomCode, setRoomCOde] = useState<string>("");

  const roomActions = useRoomActions();
  const params = useSearchParams();
  const error = params.get("error");
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  });

  const validate = (action: "join" | "create") => {
    if (!userName.trim()) {
      toast.error("username cannot be empty");
      return false;
    }
    if (action === "join" && !roomCode.trim()) {
      toast.error("room code cannot be empty when joining room");
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!validate("create")) return;
    roomActions.handleCreateRoom({
      roomName: "temp",
      userName: userName,
    });
  };

  const handleJoin = () => {
    if (!validate("join")) return;
    roomActions.handleJoinRoom({
      roomId: roomCode,
      userName: userName,
    });
  };

  return (
    <div className="h-full w-full flex justify-center items-center text-primary">
      <div className="w-4/5 md:w-1/3 flex flex-col rounded-3xl border-2">
        <div className="p-6 md:p-10">
          <Label className="mt-2">Name</Label>
          <Input
            className="my-3.5"
            value={userName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setUserName(e.target.value);
            }}
            type="text"
            placeholder="Name"
          />
          <Label className="mt-5">Room Code</Label>
          <Input
            value={roomCode}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setRoomCOde(e.target.value);
            }}
            className="my-3.5"
            type="text"
            placeholder="Room Code"
          />
          <div className="flex flex-col items-center mt-5">
            <Button variant="outline" className="mb-5" onClick={handleJoin}>
              Join
            </Button>
            <div className="flex items-center w-full">
              <Separator className="flex-1" />
              <span>or</span>
              <Separator className="flex-1" />
            </div>
            <Button className="mt-5" onClick={handleCreate}>
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
