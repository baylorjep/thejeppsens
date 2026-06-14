import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baylor & Isabel",
  description: "A personal space for Baylor and Isabel.",
  keywords: "personal, date night, restaurant picker, movie picker, vinyl catalog",
  authors: [{ name: "Baylor & Isabel Jeppsen" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-950">
        {children}
      </body>
    </html>
  );
}
