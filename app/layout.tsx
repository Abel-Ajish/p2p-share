import type { Metadata } from "next";
import "./globals.css";
import { ThemeBootstrap } from "@/components/ThemeBootstrap";

export const metadata: Metadata = {
  title: "Signal — direct file transfer",
  description: "Send files directly, browser to browser. No upload, no server storage.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-surface text-on-surface font-body antialiased min-h-screen transition-colors duration-300">
        <ThemeBootstrap>{children}</ThemeBootstrap>
      </body>
    </html>
  );
}