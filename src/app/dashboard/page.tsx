'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useAllCampaigns, useDonorStats, useUserDonations } from '../../hooks/useCharityFund';
import { useUserNFTTokens, useNFTReceipt } from '../../hooks/useCharityNFT';
import { NFTReceiptCard } from '../../components/NFTReceiptCard';
import { formatMnt, shortAddr, avatarStyle, initials, getDonorBadge, calcProgress, formatTimeLeft, getCampaignStatusBadge } from '../../utils/formatters';
import { TARGET_CHAIN_ID } from '../../config/wagmi';

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { data: balanceData } = useBalance({ address });
  const { campaigns, isLoading: isCampaignsLoading } = useAllCampaigns();
  const { stats, isLoading: isStatsLoading } = useDonorStats(address);
  const { tokenIds, isLoading: isNFTsLoading } = useUserNFTTokens(address);
  const { donations: userDonations, isLoading: isDonationsLoading } = useUserDonations(address);

  const [activeTab, setActiveTab] = useState<'campaigns' | 'donations' | 'nfts'>('campaigns');

  const [cachedBalance, setCachedBalance] = useState<string>(() => {
    if (typeof window !== 'undefined' && address) {
      return localStorage.getItem(`trustchain_balance_${address.toLowerCase()}`) || '';
    }
    return '';
  });

  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(`trustchain_balance_${address.toLowerCase()}`);
      if (stored) setCachedBalance(stored);
    }
  }, [address]);

  useEffect(() => {
    if (balanceData && address) {
      const formatted = `${(Number(balanceData.value) / 10 ** balanceData.decimals).toFixed(4)} ${balanceData.symbol}`;
      try {
        localStorage.setItem(`trustchain_balance_${address.toLowerCase()}`, formatted);
      } catch {}
      setCachedBalance(formatted);
    }
  }, [balanceData, address]);

  const balanceDisplay = balanceData
    ? `${(Number(balanceData.value) / 10 ** balanceData.decimals).toFixed(4)} ${balanceData.symbol}`
    : (cachedBalance || '-- MNT');

  const myCampaigns = campaigns.filter(
    (c) => address && c.creator.toLowerCase() === address.toLowerCase()
  );

  const totalDonated = stats?.totalDonated || 0n;
  const donorBadge = getDonorBadge(totalDonated);
  const isMantleSepolia = isConnected && chainId === TARGET_CHAIN_ID;
  const isStatsPending = isStatsLoading && !stats;

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div className="page-header" style={{ marginBottom: '2rem' }}>
          <h1 className="page-title">Personal Dashboard</h1>
          <p className="page-desc">Track your charitable footprint, created causes, and on-chain NFT receipts on Mantle Network.</p>
        </div>

        {!isConnected ? (
          <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
            </div>
            <h2 style={{ marginBottom: '0.75rem' }}>Connect Your Wallet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Connect your EVM wallet to view your real-time on-chain donation history, campaigns, and collectible SVG NFT receipts.
            </p>
          </div>
        ) : (
          <>
            {/* User Overview Profile Card */}
            <div
              className="card"
              style={{
                padding: '2rem',
                marginBottom: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: '280px' }}>
                <div
                  style={{
                    ...avatarStyle(address),
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 20px rgba(0,212,170,0.3)',
                    flexShrink: 0,
                  }}
                >
                  {initials(address)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace' }}>
                      {shortAddr(address)}
                    </span>
                    {isStatsPending ? (
                      <span className="badge badge-gray" style={{ opacity: 0.7 }}>
                        Checking Tier...
                      </span>
                    ) : (
                      <span className={`badge ${donorBadge.color}`}>
                        {donorBadge.icon} {donorBadge.label} Donor
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Balance: {balanceDisplay}
                    {' '}· Network: {isMantleSepolia ? 'Mantle Sepolia' : `Chain ${chainId}`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ minWidth: '100px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--teal)' }}>
                    {isStatsPending ? '... MNT' : `${formatMnt(totalDonated)} MNT`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Donated
                  </div>
                </div>
                <div style={{ minWidth: '90px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>
                    {isCampaignsLoading && myCampaigns.length === 0 ? '...' : myCampaigns.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    My Campaigns
                  </div>
                </div>
                <div style={{ minWidth: '90px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>
                    {isNFTsLoading && tokenIds.length === 0 && !stats ? '...' : (tokenIds.length || stats?.nftCount || 0)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    NFT Receipts
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="tabs" style={{ marginBottom: '2rem' }}>
              <button
                className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
                onClick={() => setActiveTab('campaigns')}
              >
                My Campaigns ({isCampaignsLoading && myCampaigns.length === 0 ? '...' : myCampaigns.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'donations' ? 'active' : ''}`}
                onClick={() => setActiveTab('donations')}
              >
                Donation History
              </button>
              <button
                className={`tab-btn ${activeTab === 'nfts' ? 'active' : ''}`}
                onClick={() => setActiveTab('nfts')}
              >
                NFT Receipts ({isNFTsLoading && tokenIds.length === 0 && !stats ? '...' : (tokenIds.length || stats?.nftCount || 0)})
              </button>
            </div>

            {/* Tab 1: My Campaigns */}
            {activeTab === 'campaigns' && (
              <div>
                {myCampaigns.length === 0 ? (
                  <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                    <div className="empty-state-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                      </svg>
                    </div>
                    <h3>No campaigns created yet</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
                      Start your first charitable fundraising initiative today.
                    </p>
                    <Link href="/create-campaign" className="btn btn-primary">
                      Start Campaign
                    </Link>
                  </div>
                ) : (
                  <div className="grid-2">
                    {myCampaigns.map((c) => {
                      const pct = calcProgress(c.raised, c.goal);
                      return (
                        <Link
                          key={c.id}
                          href={`/campaign/${c.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <div className="card" style={{ padding: '1.5rem', cursor: 'pointer', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.75rem' }}>
                              <h3 style={{ fontSize: '1.1rem', wordBreak: 'break-word', margin: 0 }}>{c.title}</h3>
                              {(() => {
                                const statusBadge = getCampaignStatusBadge(c);
                                return <span className={`badge ${statusBadge.badgeCls}`} style={{ flexShrink: 0 }} suppressHydrationWarning>{statusBadge.label}</span>;
                              })()}
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                              {formatMnt(c.raised)} / {formatMnt(c.goal)} MNT raised ({pct}%)
                            </p>
                            <div className="progress-bar-outer">
                              <div className="progress-bar-inner" style={{ width: `${pct}%` }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', gap: '0.5rem' }}>
                              <span>{formatTimeLeft(c.deadline, c)}</span>
                              <span>{c.donorCount} Donors</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Donation History */}
            {activeTab === 'donations' && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.25rem' }}>Contribution Records</h3>
                {isDonationsLoading && userDonations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem', width: 28, height: 28 }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Retrieving on-chain donation records...
                    </p>
                  </div>
                ) : userDonations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>No donations yet</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Your on-chain donation history will appear here after your first contribution.
                    </p>
                    <Link href="/campaigns" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                      Browse Campaigns
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {userDonations.map((item, idx) => {
                      const badge = getDonorBadge(item.amount);
                      return (
                        <div
                          key={`${item.campaignId}-${item.timestamp}-${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div>
                            <Link href={`/campaign/${item.campaignId}`} style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              Campaign #{item.campaignId}
                            </Link>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              {new Date(item.timestamp * 1000).toLocaleDateString()} · Block confirmed
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: 'var(--teal)' }}>
                              +{formatMnt(item.amount)} MNT
                            </div>
                            <span className={`badge ${badge.color}`} style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                              {badge.label} Tier
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: NFT Receipts Gallery */}
            {activeTab === 'nfts' && (
              <div>
                {isNFTsLoading && tokenIds.length === 0 ? (
                  <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem', width: 28, height: 28 }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading collectible NFT receipts from Mantle Network...</p>
                  </div>
                ) : tokenIds.length === 0 ? (
                  <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                    <div className="empty-state-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                      </svg>
                    </div>
                    <h3>No NFT receipts yet</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
                      Donate to any campaign and your on-chain SVG NFT receipt will appear here automatically.
                    </p>
                    <Link href="/campaigns" className="btn btn-primary">
                      Browse Campaigns
                    </Link>
                  </div>
                ) : (
                  <div className="grid-3">
                    {tokenIds.map((tokenId) => (
                      <NFTReceiptCard key={tokenId} tokenId={tokenId} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
