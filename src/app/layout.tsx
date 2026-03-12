import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import "./globals.css";

// Replaced external Google fonts with system fonts for build stability
const systemSans = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const systemMono = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

export const metadata: Metadata = {
  title: "miniMic",
  description: "Street performance revolution",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "miniMic",
    description: "Street performance revolution",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "miniMic brand preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "miniMic",
    description: "Street performance revolution",
    images: ["/twitter-image.png"],
  },
};

import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          suppressHydrationWarning
          className="antialiased"
          style={{ 
            fontFamily: systemSans,
            // @ts-ignore
            '--font-geist-sans': systemSans,
            '--font-geist-mono': systemMono
          } as React.CSSProperties}
        >
          {process.env.NODE_ENV === "development" ? (
            <Script
              src="https://mcp.figma.com/mcp/html-to-design/capture.js"
              strategy="afterInteractive"
            />
          ) : null}
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
