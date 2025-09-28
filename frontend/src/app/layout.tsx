import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "tideman!",
  description: "real-time tideman (run off) voting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full w-full" suppressHydrationWarning>
      <body className="w-full h-full bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
