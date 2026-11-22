import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TechStore — Mini E-Commerce',
  description:
    'Mini E-Commerce Gadget & Aksesoris Tech untuk Lab Praktikum Keamanan Jaringan',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900">
        <Suspense
          fallback={<div className="h-16 border-b border-slate-200 bg-white" />}
        >
          <Navbar />
        </Suspense>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
          TechStore Local Lab — Praktikum Keamanan Jaringan (SQLi &amp; IDOR)
        </footer>
      </body>
    </html>
  );
}
