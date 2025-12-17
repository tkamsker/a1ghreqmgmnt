import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import { ApolloProvider } from '@/lib/apollo-provider';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Requirements Management System',
  description: 'Comprehensive requirements management and traceability',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloProvider>
          <AuthProvider>{children}</AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
