import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Jeppsens - Your favorite little corner of the internet",
  description: "A personal space for Baylor and his wife to enjoy together - featuring date night pickers, bracket builders, and fun relationship tools.",
  keywords: "couple, relationship, date night, restaurant picker, movie picker, bracket builder",
  authors: [{ name: "The Jeppsens" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#ec4899",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-purple-50">
        <div className="relative">
          {/* Background decorative elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full opacity-20 blur-3xl animate-float"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-200 to-pink-200 rounded-full opacity-20 blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          </div>
          
          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
