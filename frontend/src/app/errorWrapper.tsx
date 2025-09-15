"use client";

import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function ErrorWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useSearchParams();
  const error = params.get("error");
  if (error) toast.error(error);
  return <>{children}</>;
}
