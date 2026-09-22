import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { WrongNetworkBanner } from '../components/WrongNetworkBanner';

export const metadata: Metadata = {
  title: 'TrustChain — Decentralized Charity Platform on Mantle Network',
  description: 'TrustChain is a decentralized charity platform on Mantle Network with transparent on-chain donations and dynamic SVG NFT receipts.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2300D4AA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <WrongNetworkBanner />
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - var(--nav-height) - 200px)' }}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
