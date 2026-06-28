import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ThemeProvider } from '@/components/theme-provider';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL('https://futurepath.pk'),
  title: { default: 'FuturePath — University & Career Intelligence for Pakistan', template: '%s | FuturePath' },
  description: 'AI-powered university and career counseling for Pakistani students. Explore Karachi universities, compare programs, discover scholarships, and get career guidance.',
  keywords: ['university karachi', 'pakistan universities', 'admission 2025', 'career counseling pakistan', 'NED', 'FAST', 'IBA Karachi', 'scholarship pakistan'],
  openGraph: {
    title: 'FuturePath',
    description: 'Discover universities, careers, scholarships and admission opportunities all in one place.',
    type: 'website',
    locale: 'en_PK',
    siteName: 'FuturePath',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FuturePath — University Intelligence for Pakistan',
    description: 'Explore universities, compare programs, discover scholarships.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} bg-background font-sans text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="min-h-screen bg-hero-gradient">
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
