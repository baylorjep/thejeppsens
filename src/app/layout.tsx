import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Jeppsens",
  description: "A personal space for Baylor and Isabel to make decisions together - featuring restaurant pickers, movie selectors, bracket builders, and choice tools.",
  keywords: "personal, relationship, date night, restaurant picker, movie picker, bracket builder",
  authors: [{ name: "Baylor & Isabel Jeppsen" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
        <div className="relative">
          {/* Background decorative elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full opacity-10 blur-3xl animate-float"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-gray-300 to-gray-200 rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          </div>
          
          {/* Main content with smooth transitions */}
          <div className="relative z-10">
            <div className="transition-all duration-300 ease-in-out">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
