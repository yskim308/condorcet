import { redirect } from "next/navigation";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const roomId = await params;
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendBase) throw new Error("NEXT_PUBLIC_BACKEND_URL not set in .env");

  const userName = localStorage.getItem("userName");
  const response = await fetch(`${backendBase}/room/${roomId}/getRoomData`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      userName,
    }),
  });

  if (!response.ok) {
    redirect("/");
  }

  const roomData = await response.json();

  return <h1>hello</h1>;
}
