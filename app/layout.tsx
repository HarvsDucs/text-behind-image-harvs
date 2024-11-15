import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import "./globals.css";
import UserProvider from "@/providers/UserProvider";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

import { ToastProvider } from "@/components/ui/toast";

import {
  ClerkProvider,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";

import AppPage from "@/components/actual_app/page";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Text Behind Image",
  description: "Create text behind image designs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ToastProvider>
              <UserProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  enableSystem
                  disableTransitionOnChange
                >
                  <div>
                    <SignedOut>{children}</SignedOut>
                    <SignedIn>
                      <AppPage />
                    </SignedIn>

                    <Analytics />
                    <SpeedInsights />
                    <Toaster />
                  </div>
                </ThemeProvider>
              </UserProvider>
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
