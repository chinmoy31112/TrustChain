'use client';

import React from 'react';
import { useNFTReceipt } from '../hooks/useCharityNFT';
import { formatMnt, getDonorBadge } from '../utils/formatters';

interface NFTReceiptCardProps {
  tokenId: number;
}

export function NFTReceiptCard({ tokenId }: NFTReceiptCardProps) {
  const { receipt, isLoading } = useNFTReceipt(tokenId);

  if (isLoading) {
    return (
      <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '2rem auto' }}></div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading NFT #{tokenId}...</div>
      </div>
    );
  }

  const tier = receipt?.tier || 'Bronze';
  const amount = receipt?.amount || 0n;
  const campaignTitle = receipt?.campaignTitle || `Campaign #${receipt?.campaignId || '?'}`;
  const badge = getDonorBadge(amount);

  return (
    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a1a, #1a0a2e)',
          borderRadius: '14px',
          padding: '2rem 1rem',
          marginBottom: '1rem',
          border: '1px solid rgba(0,212,170,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(0, 212, 170, 0.1)', border: '1px solid rgba(0, 212, 170, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 4.5v6c0 5.25-3.5 10-8 11.5C7.5 22.5 4 17.75 4 12.5v-6L12 2z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
        </div>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--teal)' }}>
          {formatMnt(amount)} MNT
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {campaignTitle}
        </div>
        <span className={`badge ${badge.color}`} style={{ marginTop: '0.75rem' }}>
          {tier} Receipt #{tokenId}
        </span>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        On-chain SVG NFT on Mantle Sepolia
      </div>
    </div>
  );
}
