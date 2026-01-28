'use client';

import { Toaster } from '@/components/ui/sonner';
import { Geist, Geist_Mono } from 'next/font/google';
import { SidebarProvider } from '@/components/ui/sidebar';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`bg-black overflow-hidden ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          {children}
          <Toaster position="top-center" />
        </SidebarProvider>
      </body>
    </html>
  );
}
