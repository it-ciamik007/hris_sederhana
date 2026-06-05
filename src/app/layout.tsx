import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HRIS Sederhana",
  description: "HRIS berbasis Next.js, MariaDB, approval engine, dan WhatsApp notification."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('hris-theme');
                var preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                var theme = stored || preferred;
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch (_) {}
            `
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
