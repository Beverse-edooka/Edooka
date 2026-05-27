import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { getAppOrigin } from "@/lib/app-url";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppOrigin()),
  title: "edooka | Validate your skills",
  description: "Validate your skills. Get certified in 15 minutes.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

/** Consistent scale on Safari/macOS, iOS, and desktop browsers (avoids “zoomed out” shrink-to-fit). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <body
        className={`${inter.className} min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background text-text-primary antialiased`}
      >
        <div className="mx-auto flex min-h-screen w-full min-w-0 max-w-[100vw] flex-col px-4 sm:px-6 md:px-8 lg:px-12">
          <Nav />
          <main className="page-main flex flex-1 flex-col py-4 md:py-6">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
