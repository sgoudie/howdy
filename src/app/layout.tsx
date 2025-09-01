import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderAuth from "@/components/HeaderAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Howdy",
  description: "Grow your mailing list from the stage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="w-full p-4">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="text-xl font-semibold">Howdy</div>
              <HeaderAuth />
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="w-full p-4 text-sm text-gray-500">Howdy v0.1.0</footer>
        </div>
      </body>
    </html>
  );
}
