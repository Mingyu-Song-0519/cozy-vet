import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { NetworkStatus } from "@/components/layout/network-status";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AppToaster } from "@/components/common/app-toaster";
import "./globals.css";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Cozy Animal Medical Center",
  description: "코지동물의료센터 업무 자동화",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-slate-100 text-slate-900 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <NetworkStatus />
            <main className="flex-1 p-4 pb-20 md:p-6">{children}</main>
          </div>
          <MobileNav />
          <AppToaster />
        </div>
      </body>
    </html>
  );
}
