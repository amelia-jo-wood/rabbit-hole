import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "rabbit.",
  description: "Fall down the hole. A highly addictive curiosity engine.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-ink antialiased">
        <Header />
        <main className="mx-auto max-w-md px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
