'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useDonorStats, useAllCampaigns } from '../../hooks/useCharityFund';
import { useUserNFTTokens } from '../../hooks/useCharityNFT';
import { formatMnt, shortAddr, avatarStyle, initials, getDonorBadge, explorerAddress, calcProgress, formatTimeLeft, getCampaignStatusBadge } from '../../utils/formatters';
import { useToast } from '../../components/Toast';
import { NFTReceiptCard } from '../../components/NFTReceiptCard';

function ProfileContent() {
  const searchParams = useSearchParams();
  const addressParam = searchParams.get('address') as `0x${string}` | null;
  const { address: connectedAddress } = useAccount();
  const { toast } = useToast();

  const profileAddress = addressParam || connectedAddress;

  const { stats, isLoading } = useDonorStats(profileAddress || undefined);
  const { campaigns } = useAllCampaigns();
  const { tokenIds } = useUserNFTTokens(profileAddress || undefined);

  const [activeTab, setActiveTab] = useState<'campaigns' | 'nfts'>('campaigns');

  const copyAddress = () => {
    if (profileAddress) {
      navigator.clipboard.writeText(profileAddress);
      toast.success('Address copied to clipboard!');
    }
  };

  if (!profileAddress) {
    return (
      <div className="container" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>
        <h2>No Profile Specified</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
          Connect your wallet or provide an address query parameter to inspect profile activity.
        </p>
        <Link href="/leaderboard" className="btn btn-primary">
          View Leaderboard
        </Link>
      </div>
    );
  }

  const isOwnProfile = Boolean(connectedAddress && profileAddress.toLowerCase() === connectedAddress.toLowerCase());
  const createdCampaigns = campaigns.filter(
    (c) => c.creator.toLowerCase() === profileAddress.toLowerCase()
  );

  const totalDonated = stats?.totalDonated || 0n;
  const badge = getDonorBadge(totalDonated);

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Profile Card */}
        <div
          className="card"
          style={{
            padding: '2.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                ...avatarStyle(profileAddress),
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {initials(profileAddress)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h2 style={{ fontFamily: 'monospace', fontSize: '1.4rem' }}>{shortAddr(profileAddress)}</h2>
                <button
                  onClick={copyAddress}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: 'var(--text-secondary)' }}
                  title="Copy address"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge ${badge.color}`}>
                  {badge.label} Donor
                </span>
                {isOwnProfile && <span className="badge badge-teal">Your Profile</span>}
              </div>
            </div>
          </div>

          <a
            href={explorerAddress(profileAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            View on Explorer ↗
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--teal)', whiteSpace: 'nowrap' }}>
              {formatMnt(totalDonated)} MNT
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Total Donated
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              {stats?.donationCount || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Causes Supported
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              {tokenIds.length || stats?.nftCount || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              NFT Receipts
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              {createdCampaigns.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Campaigns Created
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="tabs" style={{ marginBottom: '2rem', maxWidth: '400px' }}>
          <button
            className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            Campaigns ({createdCampaigns.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'nfts' ? 'active' : ''}`}
            onClick={() => setActiveTab('nfts')}
          >
            NFT Receipts ({tokenIds.length || stats?.nftCount || 0})
          </button>
        </div>

        {/* Tab 1: Campaigns */}
        {activeTab === 'campaigns' && (
          <div>
            {createdCampaigns.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem' }}>
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  </svg>
                </div>
                <h3>No campaigns created yet</h3>
                <p style={{ color: 'var(--text-secondary)' }}>This user has not launched any fundraising causes.</p>
              </div>
            ) : (
              <div className="grid-2">
                {createdCampaigns.map((c) => {
                  const pct = calcProgress(c.raised, c.goal);
                  return (
                    <Link key={c.id} href={`/campaign/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="card" style={{ padding: '1.5rem', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.75rem' }}>
                          <h3 style={{ wordBreak: 'break-word', margin: 0 }}>{c.title}</h3>
                          {(() => {
                            const statusBadge = getCampaignStatusBadge(c);
                            return <span className={`badge ${statusBadge.badgeCls}`} style={{ flexShrink: 0 }} suppressHydrationWarning>{statusBadge.label}</span>;
                          })()}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                          {formatMnt(c.raised)} / {formatMnt(c.goal)} MNT ({pct}%)
                        </p>
                        <div className="progress-bar-outer">
                          <div className="progress-bar-inner" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: NFTs */}
        {activeTab === 'nfts' && (
          <div>
            {tokenIds.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem' }}>
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                </div>
                <h3>No NFT receipts</h3>
                <p style={{ color: 'var(--text-secondary)' }}>This user has not received any on-chain NFT donation receipts yet.</p>
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
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="page-loader"><div className="spinner"></div></div>}>
      <ProfileContent />
    </Suspense>
  );
}
