"use client";
import axios from "axios";
import { toast } from "sonner";
import { ChangeEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

interface CreateReponseBody {
  roomId: string;
  hostKey: string;
}

export default function Home() {
  const [userName, setUserName] = useState<string>("");
  const [roomCode, setRoomCOde] = useState<string>("");

  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendBase) throw new Error("backend URL not set in .env IDIOT");

  const router = useRouter();

  const handleSubmit = async () => {
    if (!userName) {
      toast.error("name cannot be empty!");
      return;
    }
    try {
      // create room
      const response: CreateReponseBody = await axios.post(
        `${backendBase}/rooms/create`,
        {
          roomName: "",
          userName: userName,
        },
      );
      const { roomId, hostKey } = response;
      localStorage.setItem("hostKey", hostKey);
      localStorage.setItem("userName", userName);

      // join room
      await axios.post(`${backendBase}/room/join`, {
        roomId: roomId,
        userName: localStorage.getItem("userName"),
      });
      router.push(`/rooms/${roomId}`);
    } catch (e) {
      toast.error("server error ccreaitng room");
    }
  };

  const handleJoin = async () => {
    if (!userName) {
      toast.error("name cannot be empty!");
      return;
    }
    if (!roomCode) {
      toast.error("roomCode cannot be empty!");
      return;
    }
    try {
      await axios.post(`${backendBase}/room/join`, {
        roomId: roomCode,
        userName: userName,
      });
      localStorage.setItem("userName", userName);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        console.log(e.response.data);
        toast.error("error: " + e.response.data.message);
      } else {
        toast.error("network error, try again");
      }
    }
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
            <Button className="mt-5" onClick={handleSubmit}>
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
