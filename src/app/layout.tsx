import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CrewVault | Cabin Crew Learning & Adaptive Examination Platform",
  description:
    "Community-driven aviation learning platform for cabin crew — study material sharing, question banks, and adaptive practice exams.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-[#050a12] text-slate-100 selection:bg-blue-500/30 selection:text-white">
        <Navbar user={user} />
        <div className="flex flex-1 w-full">
          <Sidebar user={user} />
          <main className="flex-1 min-w-0 p-3 md:p-5 lg:p-7 xl:p-9 pb-28 lg:pb-8 overflow-y-auto animate-fade-in">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
        {user && <MobileNav />}
      </body>
    </html>
  );
}
