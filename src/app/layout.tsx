import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AvPocket - PocketMine-MP Marketplace & Asset Hub",
  description:
    "The modern marketplace, CI builder, and asset hub for PocketMine-MP developers and Minecraft Bedrock server owners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#0a0c10] text-[#e6edf3] antialiased selection:bg-brand-500 selection:text-dark-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
