import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Vazirmatn, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const vazirmatn = Vazirmatn({ subsets: ["arabic"], variable: '--font-vazirmatn' });
const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"], variable: '--font-poppins' });

export const metadata: Metadata = {
  title: "Rad AI - پلتفرم چت هوشمند",
  description: "پلتفرم چت هوشمند با قابلیت چند-API و حافظه بلندمدت",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Official Telegram Mini App SDK — provides window.Telegram.WebApp.initData */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body
        className={`${inter.variable} ${vazirmatn.variable} ${poppins.variable} antialiased transition-colors duration-300`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
