import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
export default function Home() {
  return (
    <>
      <Input type="text" placeholder="userName" required />
      <Input type="text" placeholder="roomCode" />
      <Button>join room</Button>
      <h1>or</h1>
      <Separator />
      <Button>create room</Button>
    </>
  );
}
