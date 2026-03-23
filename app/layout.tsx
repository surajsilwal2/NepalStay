import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider  from "@/components/providers/SessionProvider";
import { CalendarProvider } from "@/components/providers/CalendarContext";
import { ToastProvider }   from "@/components/providers/ToastContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "NepalStay — Book Hotels Across Nepal",
    template: "%s | NepalStay",
  },
  description:
    "Nepal's dedicated hotel booking portal. Search, compare, and book hotels in Kathmandu, Pokhara, Chitwan, and beyond. Khalti & cash payments supported.",
  manifest: "/manifest.json",
  themeColor: "#f59e0b",
  openGraph: {
    title: "NepalStay",
    description: "Book hotels across Nepal — Khalti payments, BS calendar, FNMIS compliant.",
    type: "website",
  },
    icons: {
    icon: "/logo.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
      </head>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <CalendarProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </CalendarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
