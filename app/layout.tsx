import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Google Maps Bulk Lookup Tool",
  description: "Search multiple Google Maps place ids at once",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "Google Maps Bulk Lookup Tool",
    description: "Search multiple Google Maps place ids at once",
    images: [
      {
        url: "/preview-image.png",
        width: 1200,
        height: 630,
        alt: "Google Maps Bulk Lookup Tool Preview",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        <Analytics/>
      </body>
    </html>
  );
}