import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuskerKing",
  description: "Street performance revolution",
};

import { LanguageProvider } from "@/contexts/LanguageContext";
import GlobalHomeButton from "@/components/common/GlobalHomeButton";

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
        >
          <LanguageProvider>
            <GlobalHomeButton />
            {children}
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
