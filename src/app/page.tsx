'use client';

import React from 'react';
import Link from 'next/link';
import { usePlatformStats, useAllCampaigns } from '../hooks/useCharityFund';
import { ParticleCanvas } from '../components/ParticleCanvas';
import { formatMntLabel, formatMnt, calcProgress, getCampaignStatus } from '../utils/formatters';

export default function HomePage() {
  const { campaigns: totalCampaigns, raised: totalRaised, donors: totalDonors, isLoading: statsLoading } = usePlatformStats();
  const { campaigns, isLoading: campaignsLoading } = useAllCampaigns();

  const floatingCampaigns = campaigns
    .filter((c) => getCampaignStatus(c) !== 'cancelled')
    .sort((a, b) => {
      if (b.raised > a.raised) return 1;
      if (b.raised < a.raised) return -1;
      return (b.donorCount || 0) - (a.donorCount || 0);
    })
    .slice(0, 3);

  return (
    <>
      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb orb-1"></div>
          <div className="hero-orb orb-2"></div>
          <div className="hero-orb orb-3"></div>
          <ParticleCanvas />
        </div>

        <div className="container hero-two-col">
          {/* LEFT: Text content */}
          <div className="hero-content fade-up">
            <h1 className="hero-title">
              Fund Change,<br />
              <span className="gradient-text">Transparently.</span>
            </h1>

            <p className="hero-desc">
              Empowering global philanthropy with trustless smart contract escrow, automated on-chain NFT receipts, and guaranteed donor protections on Mantle Network — zero middlemen, zero fraud, near-zero gas fees.
            </p>

            <div className="hero-actions">
              <Link href="/campaigns" prefetch={true} className="btn btn-primary btn-lg">
                Explore Campaigns
              </Link>
              <Link href="/create-campaign" prefetch={true} className="btn btn-secondary btn-lg">
                Start a Campaign
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
              <div style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--teal)', minHeight: '2rem', display: 'flex', alignItems: 'center' }}>
                  {statsLoading ? (
                    <span className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '6px', display: 'inline-block' }}></span>
                  ) : (
                    formatMntLabel(totalRaised)
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>
                  MNT Raised
                </div>
              </div>
              <div style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, minHeight: '2rem', display: 'flex', alignItems: 'center' }}>
                  {statsLoading ? (
                    <span className="skeleton" style={{ width: '40px', height: '24px', borderRadius: '6px', display: 'inline-block' }}></span>
                  ) : (
                    totalCampaigns
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>
                  Campaigns
                </div>
              </div>
              <div style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, minHeight: '2rem', display: 'flex', alignItems: 'center' }}>
                  {statsLoading ? (
                    <span className="skeleton" style={{ width: '40px', height: '24px', borderRadius: '6px', display: 'inline-block' }}></span>
                  ) : (
                    totalDonors
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>
                  Donors
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Animated floating cards with REAL live & best donated campaigns */}
          <div className="hero-visual">
            <div className="hero-globe"></div>

            {floatingCampaigns.length === 0 ? (
              campaignsLoading ? (
                <div className="hero-float-card card-float-solo" style={{ opacity: 0.85 }}>
                  <div className="hfc-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                  <div className="hfc-body">
                    <div style={{ width: '80px', height: '14px', background: 'rgba(255,255,255,0.12)', borderRadius: '4px', marginBottom: '4px' }}></div>
                    <div style={{ width: '55px', height: '11px', background: 'rgba(0,212,170,0.15)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ) : (
                <Link href="/create-campaign" className="hero-float-card card-float-1" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="hfc-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </div>
                  <div className="hfc-body">
                    <div className="hfc-title">Start First Cause</div>
                    <div className="hfc-raised">Mantle Escrow</div>
                    <div className="hfc-bar"><div className="hfc-bar-fill" style={{ width: '100%' }}></div></div>
                  </div>
                </Link>
              )
            ) : (
              floatingCampaigns.map((c, idx) => {
                const pct = calcProgress(c.raised, c.goal);
                let floatClass = idx === 0 ? 'card-float-1' : idx === 1 ? 'card-float-2' : 'card-float-3';
                if (floatingCampaigns.length === 1) {
                  floatClass = 'card-float-solo';
                }
                const strokeColor = idx === 0 ? 'var(--teal)' : idx === 1 ? '#60a5fa' : '#a78bfa';

                return (
                  <Link
                    key={c.id}
                    href={`/campaign/${c.id}`}
                    prefetch={true}
                    className={`hero-float-card ${floatClass}`}
                    style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <div className="hfc-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                      </svg>
                    </div>
                    <div className="hfc-body">
                      <div className="hfc-title" title={c.title}>{c.title}</div>
                      <div className="hfc-raised">+{formatMnt(c.raised)} MNT</div>
                      <div className="hfc-bar">
                        <div className="hfc-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">How TrustChain Works</h2>
            <p className="section-desc">Fully autonomous, transparent, and secure on the Mantle blockchain.</p>
          </div>

          <div className="grid-3">
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(0, 212, 170, 0.12)', color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>01</div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>1. Create & Verify</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Launch a verified philanthropic campaign with immutable parameters, IPFS metadata, and transparent milestones.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(124, 58, 237, 0.12)', color: 'var(--purple)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>02</div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>2. Smart Contract Escrow</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Donate MNT with near-zero gas fees. Funds are held safely in decentralized smart contract escrow until goals are met.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(0, 212, 170, 0.12)', color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>03</div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>3. Dynamic NFT Receipts</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Every contribution automatically mints an immutable, tiered on-chain SVG NFT receipt straight to your wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ CORE PROTOCOL GUARANTEES ══════════════════════ */}
      <section className="section" id="protocol-guarantees" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">Core Protocol Guarantees</h2>
            <p className="section-desc">Why traditional philanthropy is being replaced by TrustChain smart contracts.</p>
          </div>

          <div className="grid-4">
            <div className="card" style={{ padding: '1.75rem', textAlign: 'left' }}>
              <div style={{ color: 'var(--teal)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '0.5rem' }}>Protection</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}>Trustless Escrow</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Campaign creators cannot withdraw donations until the target goal is met or duration completes. No misappropriation of funds.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem', textAlign: 'left' }}>
              <div style={{ color: '#60a5fa', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '0.5rem' }}>Safety</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}>Automated Refunds</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                If a campaign is cancelled by the creator, 100% of donor funds are automatically unlocked for immediate withdrawal.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem', textAlign: 'left' }}>
              <div style={{ color: 'var(--purple)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '0.5rem' }}>Proof</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}>On-Chain SVG NFTs</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Every donation generates a permanent, non-fungible digital certificate stored directly on the blockchain as undeniable proof of impact.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem', textAlign: 'left' }}>
              <div style={{ color: 'var(--teal)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '0.5rem' }}>Efficiency</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}>Near-Zero Gas</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Powered by Mantle L2 rollups, enabling micro-donations and macro-philanthropy without paying heavy Ethereum gas fees.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
