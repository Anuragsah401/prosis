import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PROSIS — Enterprise AI Operating System",
  description: "The intelligent operating interface for enterprise ecosystem and business applications.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-obsidian-950 text-gray-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}

