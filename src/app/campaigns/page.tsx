'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAllCampaigns } from '../../hooks/useCharityFund';
import { SafeImage } from '../../components/SafeImage';
import { CATEGORIES } from '../../config/contracts';
import { formatMnt, calcProgress, formatTimeLeft, getCategoryIcon, getCampaignStatus, getCampaignStatusBadge } from '../../utils/formatters';

function CampaignsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('cat') || 'all';

  const { campaigns, isLoading } = useAllCampaigns();

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [pageSize, setPageSize] = useState<number>(9);

  const filteredAndSortedCampaigns = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);

    let list = campaigns.filter((c) => {
      // Category filter
      if (activeCategory !== 'all' && c.category.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }

      // Status filter
      const cStatus = getCampaignStatus(c);
      if (activeStatus === 'cancelled') {
        if (cStatus !== 'cancelled') return false;
      } else if (activeStatus === 'all') {
        // Exclude cancelled campaigns from 'All Status' view so they only show in 'Cancelled' tab
        if (cStatus === 'cancelled') return false;
      } else {
        if (cStatus !== activeStatus) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const haystack = `${c.title} ${c.description} ${c.category}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'mostFunded') {
        const pctA = calcProgress(a.raised, a.goal);
        const pctB = calcProgress(b.raised, b.goal);
        return pctB - pctA;
      }
      if (sortBy === 'endingSoon') return a.deadline - b.deadline;
      if (sortBy === 'mostVoted') return b.voteCount - a.voteCount;
      return 0;
    });

    return list;
  }, [campaigns, activeCategory, activeStatus, searchQuery, sortBy]);

  const displayedCampaigns = filteredAndSortedCampaigns.slice(0, pageSize);

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: '2rem' }}>
          <h1 className="page-title">Explore Campaigns</h1>
          <p className="page-desc">
            Discover verified charitable causes on Mantle Network. Every donation receives an on-chain NFT receipt.
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '480px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search campaigns by title, description or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sort by:</span>
            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: 'auto', minWidth: '145px', padding: '0.5rem 2.25rem 0.5rem 1rem' }}
            >
              <option value="newest">Newest First</option>
              <option value="mostFunded">Most Funded</option>
              <option value="endingSoon">Ending Soon</option>
              <option value="mostVoted">Most Voted</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="filter-tabs" style={{ marginBottom: '1rem' }}>
          {[
            { label: 'All Status', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Goal Met', value: 'completed' },
            { label: 'Ended', value: 'ended' },
            { label: 'Cancelled', value: 'cancelled' },
          ].map((tab) => (
            <button
              key={tab.value}
              className={`filter-tab ${activeStatus === tab.value ? 'active' : ''}`}
              onClick={() => setActiveStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter Tabs */}
        <div className="filter-tabs" style={{ marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`filter-tab ${activeCategory === cat.value ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Campaign Count Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredAndSortedCampaigns.length}</strong> campaigns
          </span>
          {(activeCategory !== 'all' || activeStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setActiveCategory('all');
                setActiveStatus('all');
                setSearchQuery('');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Campaigns Grid */}
        {isLoading ? (
          <div className="page-loader" style={{ minHeight: '30vh' }}>
            <div className="spinner"></div>
            <span>Loading campaigns from Mantle Network...</span>
          </div>
        ) : displayedCampaigns.length === 0 ? (
          <div className="empty-state" style={{ padding: '5rem 2rem' }}>
            <div className="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            <h3>No campaigns found</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
              Try adjusting your search terms or filter criteria.
            </p>
            <button
              className="btn btn-outline"
              onClick={() => {
                setActiveCategory('all');
                setActiveStatus('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid-3" id="campaignsGrid">
            {displayedCampaigns.map((c, i) => {
              const pct = calcProgress(c.raised, c.goal);
              const raisedStr = formatMnt(c.raised);
              const goalStr = formatMnt(c.goal);

              return (
                <Link
                  key={c.id}
                  href={`/campaign/${c.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <article className={`card campaign-card fade-up stagger-${(i % 6) + 1}`} style={{ cursor: 'pointer', height: '100%' }}>
                    <div className="campaign-card-img-wrapper" style={{ position: 'relative' }}>
                      <SafeImage
                        src={c.imageUrl}
                        alt={c.title}
                        className="campaign-card-img"
                        loading="lazy"
                      />
                      <span className="badge badge-purple" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                        {c.category}
                      </span>
                    </div>
                    <div className="campaign-card-body">
                      <h3 className="campaign-card-title">{c.title}</h3>
                      <p className="campaign-card-desc">{c.description}</p>
                      <div className="progress-wrap">
                        <div className="progress-info">
                          <span className="progress-raised">{raisedStr} MNT</span>
                          <span className="progress-goal">of {goalStr} MNT</span>
                        </div>
                        <div className="progress-bar-outer">
                          <div className="progress-bar-inner" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                      <div className="campaign-card-meta">
                        {(() => {
                          const statusBadge = getCampaignStatusBadge(c);
                          return <span className={`badge ${statusBadge.badgeCls}`}>{statusBadge.label}</span>;
                        })()}
                        <span>{formatTimeLeft(c.deadline, c)}</span>
                        <span>{c.donorCount || 0} Donors</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {filteredAndSortedCampaigns.length > pageSize && (
          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <button className="btn btn-outline btn-lg" onClick={() => setPageSize((prev) => prev + 6)}>
              Load More Campaigns
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div className="page-loader"><div className="spinner"></div></div>}>
      <CampaignsContent />
    </Suspense>
  );
}
