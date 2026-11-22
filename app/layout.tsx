import "./globals.css";
import type { Metadata, Viewport } from "next";
import Shell from "@/components/Shell";
export const metadata: Metadata = { title: "Life OS", description: "Personal goal and time system", manifest: "/manifest.webmanifest", icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" }, appleWebApp: { capable: true, title: "Life OS" } };
export const viewport: Viewport = { themeColor: "#1F6F8B", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body><Shell>{children}</Shell></body></html>);
}
