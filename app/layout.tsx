import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CriticalEventsMonitor } from "@/components/critical-events-monitor";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Argus",
  description:
    "Computer-vision analytics for live and recorded video, with an AI assistant for search and insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <CriticalEventsMonitor />
        </ThemeProvider>
      </body>
    </html>
  );
}
