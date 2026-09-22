'use client';

import React from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useLeaderboard } from '../../hooks/useCharityFund';
import { formatMnt, shortAddr, avatarStyle, initials, getDonorBadge } from '../../utils/formatters';

export default function LeaderboardPage() {
  const { address } = useAccount();
  const { leaderboard, isLoading } = useLeaderboard(20);

  const top3 = leaderboard.slice(0, 3);
  const orderedTop3 = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumPositions = ['second', 'first', 'third'];
  const podiumRanks = [2, 1, 3];

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div className="page-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="page-title">Donor Leaderboard</h1>
          <p className="page-desc">Celebrating the top contributors driving transparent change on Mantle Network.</p>
        </div>

        {/* Podium View */}
        {top3.length >= 3 && (
          <div
            id="podium"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: '1.5rem',
              marginBottom: '3.5rem',
              flexWrap: 'wrap',
            }}
          >
            {orderedTop3.map((d, i) => {
              const badge = getDonorBadge(d.total);
              const isFirst = podiumRanks[i] === 1;

              return (
                <div
                  key={d.address}
                  className={`card ${isFirst ? 'card-glow' : ''}`}
                  style={{
                    padding: isFirst ? '2.5rem 1.5rem' : '1.75rem 1.25rem',
                    textAlign: 'center',
                    flex: '1 1 200px',
                    maxWidth: '240px',
                    border: isFirst ? '2px solid var(--teal)' : '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ width: 36, height: 36, borderRadius: '50%', background: isFirst ? 'var(--teal)' : 'rgba(255,255,255,0.1)', color: isFirst ? '#07071a' : '#fff', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      #{podiumRanks[i]}
                    </span>
                  </div>
                  <div
                    style={{
                      ...avatarStyle(d.address),
                      width: isFirst ? '64px' : '48px',
                      height: isFirst ? '64px' : '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isFirst ? '1.25rem' : '1rem',
                      fontWeight: 800,
                      margin: '0 auto 0.75rem auto',
                    }}
                  >
                    {initials(d.address)}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: isFirst ? '1.1rem' : '0.95rem' }}>
                    #{podiumRanks[i]} Rank
                  </div>
                  <Link
                    href={`/profile?address=${d.address}`}
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--teal)', display: 'block', margin: '0.25rem 0' }}
                  >
                    {shortAddr(d.address)}
                  </Link>
                  <div style={{ fontWeight: 800, color: 'var(--teal)', fontSize: isFirst ? '1.2rem' : '1rem', marginTop: '0.5rem' }}>
                    {formatMnt(d.total)} MNT
                  </div>
                  <span className={`badge ${badge.color}`} style={{ marginTop: '0.5rem' }}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Global Leaderboard Table */}
        <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Global Donor Rankings</h3>

          {isLoading ? (
            <div className="page-loader" style={{ minHeight: '20vh' }}>
              <div className="spinner"></div>
              <span>Loading rankings...</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/>
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"/>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                  </svg>
                </div>
              </div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Donors Yet</h3>
              <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                Be the first to donate to a campaign on Mantle Network and claim the #1 rank on the global leaderboard!
              </p>
              <Link href="/campaigns" className="btn btn-primary btn-sm">
                Explore Campaigns to Donate
              </Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem 0.75rem' }}>Rank</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Donor Address</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Total Donated</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Badge Tier</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((d, index) => {
                  const badge = getDonorBadge(d.total);
                  const isMe = Boolean(address && d.address.toLowerCase() === address.toLowerCase());

                  return (
                    <tr
                      key={d.address}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background: isMe ? 'rgba(0,212,170,0.08)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 700 }}>
                        #{index + 1}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              ...avatarStyle(d.address),
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {initials(d.address)}
                          </div>
                          <Link href={`/profile?address=${d.address}`} style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                            {shortAddr(d.address)}
                          </Link>
                          {isMe && <span className="badge badge-teal" style={{ fontSize: '0.65rem' }}>You</span>}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 700, color: 'var(--teal)' }}>
                        {formatMnt(d.total)} MNT
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span className={`badge ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
