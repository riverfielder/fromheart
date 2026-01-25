import "./globals.css";

export const metadata = {
  title: "一问 / from heart",
  description: "每日一问，基于易经与梅花易数",
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