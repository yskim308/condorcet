import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
export default function Home() {
  return (
    <div className="h-full w-full flex justify-center items-center text-primary">
      <div className="w-4/5 md:w-1/3 flex flex-col rounded-3xl border-2">
        <div className="p-6 md:p-10">
          <Label className="mt-2">Name</Label>
          <Input className="my-3.5" type="text" placeholder="name" required />
          <Label className="mt-5">Room Code</Label>
          <Input className="my-3.5" type="text" placeholder="roomCode" />
          <div className="flex flex-col items-center mt-5">
            <Button variant="outline" className="mb-5">
              Join
            </Button>
            <h1>or</h1>
            <Separator />
            <Button className="mt-10">Create</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
