"use client";
import { useState } from "react";
import SocketManager from "@/components/socket-manager";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en" className="h-full w-full" suppressHydrationWarning>
      <body className="w-full h-full bg-background">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system">
            <SocketManager>{children}</SocketManager>
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
