import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iceland Insight",
  description: "Iceland Insight MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
