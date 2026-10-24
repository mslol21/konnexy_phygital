import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const geistSans = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap'
});

const geistMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Konnexy Tag | Design System Phygital SaaS Multi-Tenant',
  description: 'Placas Inteligentes NFC & QR Code com Avaliação Google via IA e Micro-Landing Page'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
