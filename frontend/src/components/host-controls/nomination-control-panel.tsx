"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function NominationControlPanel() {
  const [input, setInput] = useState<string>("");
  return (
    <>
      <h1 className="text-5xl text-red-400">
        ok checking, should only show on host
      </h1>
      <Input />
      <Button>Next State</Button>
    </>
  );
}
