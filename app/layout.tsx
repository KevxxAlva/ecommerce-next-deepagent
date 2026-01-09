import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { ConditionalLayout } from '@/components/conditional-layout';
import { Toaster } from 'sonner';
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'ShopHub - Tu Tienda Online',
  description: 'Tienda online moderna con los mejores productos',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'ShopHub - Tu Tienda Online',
    description: 'Tienda online moderna con los mejores productos',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={inter.className}>
        <Providers>
          <NextTopLoader color="#60B5FF" showSpinner={false} />
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
