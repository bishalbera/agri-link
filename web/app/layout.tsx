// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agri-Link | Crisis Shield for Farmers",
  description: "AI-powered agricultural crisis prevention system. Get fair prices for your crops with autonomous negotiation and market crash protection.",
  keywords: ["agriculture", "farming", "mandi prices", "crop selling", "AI agents", "India"],
  authors: [{ name: "Agri-Link Team" }],
  openGraph: {
    title: "Agri-Link - Your Crop, Fair Price",
    description: "AI-powered agricultural crisis prevention system",
    type: "website",
    locale: "en_IN",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
