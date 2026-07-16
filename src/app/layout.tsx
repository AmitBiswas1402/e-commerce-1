import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const mono = Geist_Mono({subsets:['latin'],variable:'--font-mono'});

export const metadata: Metadata = {
  title: "E-commerce App",
  description: "Welcome to our store!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
        <body
          className={`${geist.variable} ${mono.variable} min-h-full flex flex-col`}
          suppressHydrationWarning
        >
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
