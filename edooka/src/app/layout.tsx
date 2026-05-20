import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "edooka | Validate your skills",
  description: "Validate your skills. Get certified in 15 minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} min-h-screen w-full bg-background text-text-primary antialiased`}
      >
        <div className="flex min-h-screen w-full flex-col px-4 sm:px-6 md:px-8 lg:px-12">
          <Nav />
          <main className="page-main flex flex-1 flex-col py-6 md:py-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
