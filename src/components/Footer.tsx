import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Column 1: Brand & Mission */}
          <div className="footer-brand">
            <Link href="/" className="navbar-brand" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
              <div className="brand-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <span className="brand-text">TrustChain</span>
            </Link>
            <p className="footer-desc">
              TrustChain eliminates charity intermediaries and fraud through autonomous smart contracts on Mantle Network. It secures donations in decentralized escrow, guarantees automated donor refunds if goals are missed or campaigns cancelled, and instantly mints immutable on-chain SVG NFT receipts as permanent cryptographic proof of philanthropy.
            </p>
          </div>

          {/* Column 2: Platform Links */}
          <div className="footer-col">
            <h4>Platform</h4>
            <ul className="footer-links">
              <li><Link href="/campaigns">Explore Campaigns</Link></li>
              <li><Link href="/create-campaign">Start a Campaign</Link></li>
              <li><Link href="/leaderboard">Donor Leaderboard</Link></li>
              <li><Link href="/dashboard">Personal Dashboard</Link></li>
            </ul>
          </div>

          {/* Column 3: Protocol Guarantees */}
          <div className="footer-col">
            <h4>Guarantees</h4>
            <ul className="footer-links">
              <li><Link href="/#how-it-works">Trustless Escrow</Link></li>
              <li><Link href="/#protocol-guarantees">Automated Refunds</Link></li>
              <li><Link href="/#protocol-guarantees">Dynamic NFT Receipts</Link></li>
              <li><Link href="/#protocol-guarantees">Near-Zero Gas Fees</Link></li>
            </ul>
          </div>

          {/* Column 4: Network & Resources */}
          <div className="footer-col">
            <h4>Network</h4>
            <ul className="footer-links">
              <li><a href="https://sepolia.mantlescan.xyz" target="_blank" rel="noopener noreferrer">Mantle Sepolia Explorer ↗</a></li>
              <li><a href="https://faucet.sepolia.mantle.xyz" target="_blank" rel="noopener noreferrer">Mantle Faucet ↗</a></li>
              <li><a href="https://docs.mantle.xyz" target="_blank" rel="noopener noreferrer">Mantle Documentation ↗</a></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">Verified Smart Contracts ↗</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 TrustChain — Decentralized Charity Protocol. All rights reserved.</span>
          <div className="footer-status">
            <span className="status-dot"></span>
            <span>Mantle Network Live</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
