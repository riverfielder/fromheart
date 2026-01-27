import "./globals.css";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#F5F5F4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "一问 / from heart",
  description: "每日一问，基于易经与梅花易数",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "一问",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {children}
        </div>
      </body>
    </html>
  );
}