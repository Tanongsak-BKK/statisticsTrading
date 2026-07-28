import type { Metadata } from 'next';
import { Inter, Prompt } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-prompt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Trading Journal & Analytics - หน้าบันทึกสถิติการเทรด',
  description: 'ระบบบันทึกและวิเคราะห์สถิติการเทรดหุ้น สรุปผลยอดรวมรายสัปดาห์ (Total Week) และรายเดือน (Total Month)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${inter.variable} ${prompt.variable}`}>
      <body style={{ fontFamily: 'var(--font-prompt), var(--font-inter), sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
