'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { SafeImage } from '../../../components/SafeImage';
import { useCampaign, useFundContractAddress, useCampaignDonations } from '../../../hooks/useCharityFund';
import { CHARITY_FUND_ABI, NFT_TIERS } from '../../../config/contracts';
import { formatMnt, calcProgress, formatTimeLeft, getCategoryIcon, shortAddr, getDonorBadge, avatarStyle, initials, explorerAddress, getCampaignStatus, getCampaignStatusBadge } from '../../../utils/formatters';
import { useToast } from '../../../components/Toast';
import { TARGET_CHAIN_ID } from '../../../config/wagmi';

export default function CampaignDetailPage() {
  const params = useParams();
  const id = Number(params?.id || 0);

  const { campaign, isLoading, refetch } = useCampaign(id);
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();
  const fundAddress = useFundContractAddress();
  const { donations: campaignDonations, refetch: refetchDonations } = useCampaignDonations(id);

  const [donationAmount, setDonationAmount] = useState<string>('0.1');
  const [activeTab, setActiveTab] = useState<'about' | 'donors' | 'governance'>('about');

  // Gasless opinion vote state
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [serverVotes, setServerVotes] = useState<{ up: number; down: number }>({ up: 0, down: 0 });

  useEffect(() => {
    if (campaign && campaign.id !== undefined) {
      // 1. Restore this specific user's choice from localStorage
      const savedVote = localStorage.getItem(`trustchain_vote_${campaign.id}`);
      if (savedVote === 'up' || savedVote === 'down') {
        setUserVote(savedVote);
      } else {
        setUserVote(null);
      }

      // 2. Fetch global synced votes from server API
      let isMounted = true;
      const fetchVotes = async () => {
        try {
          const res = await fetch(`/api/votes?campaignId=${campaign.id}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && typeof data.up === 'number' && typeof data.down === 'number') {
              setServerVotes(data);
            }
          }
        } catch {}
      };

      fetchVotes();
      const interval = setInterval(fetchVotes, 3000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [campaign?.id]);

  // Wagmi write contracts
  const { data: donateTxHash, writeContract: writeDonate, isPending: isDonating } = useWriteContract();
  const { isLoading: isWaitingDonate, isSuccess: isDonateSuccess } = useWaitForTransactionReceipt({
    hash: donateTxHash,
  });

  const { data: voteTxHash, writeContract: writeVote, isPending: isVoting } = useWriteContract();
  const { isLoading: isWaitingVote, isSuccess: isVoteSuccess } = useWaitForTransactionReceipt({
    hash: voteTxHash,
  });

  const { data: withdrawTxHash, writeContract: writeWithdraw, isPending: isWithdrawing } = useWriteContract();
  const { isLoading: isWaitingWithdraw, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawTxHash,
  });

  const { data: cancelTxHash, writeContract: writeCancel, isPending: isCancelling } = useWriteContract();
  const { isLoading: isWaitingCancel, isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({
    hash: cancelTxHash,
  });

  // Re-fetch data on transaction success
  React.useEffect(() => {
    if (isDonateSuccess) {
      toast.success('Donation confirmed! Your NFT receipt has been minted.');
      try {
        localStorage.removeItem('trustchain_cached_campaigns');
        localStorage.removeItem('trustchain_cached_platform_stats');
        localStorage.removeItem('trustchain_cached_leaderboard');
        if (address) {
          localStorage.removeItem(`trustchain_cached_donor_${address.toLowerCase()}`);
          localStorage.removeItem(`trustchain_cached_user_donations_${address.toLowerCase()}`);
          localStorage.removeItem(`trustchain_cached_nft_tokens_${address.toLowerCase()}`);
        }
      } catch {}
      refetch();
      refetchDonations();
    }
  }, [isDonateSuccess, toast, refetch, refetchDonations, address]);

  React.useEffect(() => {
    if (isVoteSuccess) {
      toast.success('Vote recorded successfully!');
      refetch();
    }
  }, [isVoteSuccess, toast, refetch]);

  React.useEffect(() => {
    if (isWithdrawSuccess) {
      toast.success('Funds withdrawn successfully to creator wallet.');
      refetch();
    }
  }, [isWithdrawSuccess, toast, refetch]);

  React.useEffect(() => {
    if (isCancelSuccess) {
      toast.success('Campaign cancelled and donors refunded.');
      refetch();
    }
  }, [isCancelSuccess, toast, refetch]);

  if (isLoading) {
    return (
      <div className="page-loader" style={{ minHeight: '60vh', paddingTop: 'calc(var(--nav-height) + 3rem)' }}>
        <div className="spinner"></div>
        <span>Loading campaign details...</span>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>
        <h2>Campaign Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
          This campaign doesn&apos;t exist or hasn&apos;t been indexed yet.
        </p>
        <Link href="/campaigns" className="btn btn-primary">
          Browse Campaigns
        </Link>
      </div>
    );
  }

  const c = campaign;
  const pct = calcProgress(c.raised, c.goal);
  const raisedStr = formatMnt(c.raised);
  const goalStr = formatMnt(c.goal);
  const catIcon = getCategoryIcon(c.category);
  const now = Math.floor(Date.now() / 1000);
  const status = getCampaignStatus(c);
  const isCancelled = status === 'cancelled';
  const isEnded = Number(c.deadline) < now || !c.active || isCancelled;
  const isOwner = Boolean(address && address.toLowerCase() === c.creator.toLowerCase());
  const canWithdraw = isOwner && !c.withdrawn && !isCancelled && (pct >= 100 || Number(c.deadline) < now);

  const parsedAmount = parseFloat(donationAmount || '0');
  const previewBadge = getDonorBadge(parseEther(donationAmount && !isNaN(parsedAmount) && parsedAmount > 0 ? donationAmount : '0'));

  const contractErrorMsg = (error: any): string => {
    const msg = error?.shortMessage || error?.message || 'Transaction failed';
    if (msg.includes('User rejected') || msg.includes('denied')) return 'Transaction rejected by user';
    if (msg.includes('execution reverted') || msg.includes('could not coalesce'))
      return 'Smart contract call failed — the CharityFund contract may not be deployed on Mantle Sepolia yet. Deploy it first with: npm run deploy:testnet';
    return msg;
  };

  const handleDonate = () => {
    if (!isConnected) {
      toast.warning('Please connect your wallet first');
      return;
    }
    if (chainId !== TARGET_CHAIN_ID) {
      toast.error('Please switch to Mantle Sepolia Testnet');
      return;
    }
    if (!fundAddress) {
      toast.error('Contract address not configured');
      return;
    }
    if (!donationAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    (writeDonate as any)(
      {
        address: fundAddress,
        abi: CHARITY_FUND_ABI,
        functionName: 'donate',
        args: [BigInt(c.id)],
        value: parseEther(donationAmount),
      },
      {
        onSuccess: () => toast.info('Donation sent! Waiting for on-chain confirmation...'),
        onError: (error: any) => toast.error(contractErrorMsg(error)),
      }
    );
  };

  const handleVote = async (support: boolean) => {
    if (!campaign) return;
    // Block voting for ended/completed/cancelled campaigns
    if (isEnded || pct >= 100 || isCancelled || c.withdrawn) {
      toast.info('Voting is closed for this campaign.');
      return;
    }
    const voteType = support ? 'up' : 'down';
    const previousVote = userVote;

    // Allow user to toggle off (undo) their vote if clicking the active vote
    if (userVote === voteType) {
      setUserVote(null);
      localStorage.removeItem(`trustchain_vote_${campaign.id}`);

      // Optimistic update
      setServerVotes((prev) => ({
        up: voteType === 'up' ? Math.max(0, prev.up - 1) : prev.up,
        down: voteType === 'down' ? Math.max(0, prev.down - 1) : prev.down,
      }));

      try {
        const res = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: campaign.id,
            voteType: null,
            previousVote: voteType,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setServerVotes(data);
        }
      } catch {}

      toast.info('Vote removed.');
      return;
    }

    // New vote or switch vote
    setUserVote(voteType);
    localStorage.setItem(`trustchain_vote_${campaign.id}`, voteType);

    // Optimistic update
    setServerVotes((prev) => {
      let up = prev.up;
      let down = prev.down;
      if (previousVote === 'up') up = Math.max(0, up - 1);
      if (previousVote === 'down') down = Math.max(0, down - 1);
      if (voteType === 'up') up += 1;
      if (voteType === 'down') down += 1;
      return { up, down };
    });

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          voteType,
          previousVote,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setServerVotes(data);
      }
    } catch {}

    toast.success(
      `Opinion recorded: ${support ? 'Supported' : 'Voted Against'}!`
    );
  };

  const handleWithdraw = () => {
    if (!fundAddress) return;
    (writeWithdraw as any)(
      {
        address: fundAddress,
        abi: CHARITY_FUND_ABI,
        functionName: 'withdraw',
        args: [BigInt(c.id)],
      },
      {
        onSuccess: () => toast.info('Withdrawal sent! Waiting for on-chain confirmation...'),
        onError: (error: any) => toast.error(contractErrorMsg(error)),
      }
    );
  };

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel this campaign? All donors will be refunded automatically.')) return;
    if (!fundAddress) return;
    (writeCancel as any)(
      {
        address: fundAddress,
        abi: CHARITY_FUND_ABI,
        functionName: 'cancelCampaign',
        args: [BigInt(c.id)],
      },
      {
        onSuccess: () => toast.info('Cancellation sent! Waiting for on-chain confirmation...'),
        onError: (error: any) => toast.error(contractErrorMsg(error)),
      }
    );
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Support "${c.title}" on TrustChain — decentralized charity on Mantle Network`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const totalUp = Math.max(0, (c.voteCount || 0) + serverVotes.up);
  const totalDown = Math.max(0, (c.againstCount || 0) + serverVotes.down);
  const isCommunityFlagged = totalDown >= 3 && totalDown > totalUp;

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Breadcrumb */}
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <Link href="/campaigns" style={{ color: 'var(--teal)' }}>
            ← All Campaigns
          </Link>{' '}
          / {c.title}
        </p>

        <div className="campaign-detail-grid">
          {/* Main Column */}
          <div>
            <div style={{ position: 'relative', marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <SafeImage
                src={c.imageUrl}
                alt={c.title}
                className="detail-hero-img"
              />
              <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', zIndex: 2 }}>
                <span className="badge badge-purple" style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(7, 7, 26, 0.78)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                  {catIcon} {c.category}
                </span>
                {(() => {
                  const badge = getCampaignStatusBadge(c);
                  return <span className={`badge ${badge.badgeCls}`} style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: 'rgba(7, 7, 26, 0.78)', border: '1px solid rgba(255, 255, 255, 0.2)' }} suppressHydrationWarning>{badge.label}</span>;
                })()}
                {isCommunityFlagged && (
                  <span
                    className="badge badge-danger"
                    style={{
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      background: 'rgba(255, 71, 87, 0.4)',
                      border: '1px solid #ff4757',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    ⚠️ Skepticism Alert
                  </span>
                )}
              </div>
            </div>

            <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{c.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Created by{' '}
              <Link href={`/profile?address=${c.creator}`} style={{ color: 'var(--teal)', fontFamily: 'monospace' }}>
                {shortAddr(c.creator)}
              </Link>{' '}
              &nbsp;·&nbsp; Deadline:{' '}
              {new Date(c.deadline * 1000).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>

            {/* Community Warning Alert Banner */}
            {isCommunityFlagged && (
              <div
                style={{
                  background: 'rgba(255, 71, 87, 0.08)',
                  border: '1px solid rgba(255, 71, 87, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.75rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                }}
              >
                <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>⚠️</span>
                <div>
                  <div style={{ color: '#ff4757', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    Community Warning: High Skepticism Reported
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0, lineHeight: 1.55 }}>
                    This cause has received <strong>{totalDown} votes against</strong> compared to {totalUp} supporting. The community has flagged potential concerns. Please verify project milestones, organization credentials, and team identity before donating funds.
                  </p>
                </div>
              </div>
            )}

            {/* Progress Card */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--teal)' }}>
                    {raisedStr} MNT
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    raised of {goalStr} MNT goal
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{pct}%</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {formatTimeLeft(c.deadline, c)}
                  </div>
                </div>
              </div>

              <div className="progress-bar-outer" style={{ height: '10px' }}>
                <div className="progress-bar-inner" style={{ width: `${pct}%` }}></div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{c.donorCount || 0}</span>{' '}
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>donors</span>
                </div>
                <div>
                  <span style={{ fontWeight: 700 }}>{totalUp}</span>{' '}
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>supporting</span>
                </div>
                <div>
                  <span style={{ fontWeight: 700 }}>{totalDown}</span>{' '}
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>against</span>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="tabs" style={{ marginBottom: '1.5rem' }}>
              <button
                className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => setActiveTab('about')}
              >
                About
              </button>
              <button
                className={`tab-btn ${activeTab === 'donors' ? 'active' : ''}`}
                onClick={() => setActiveTab('donors')}
              >
                Donors ({c.donorCount || 0})
              </button>
              <button
                className={`tab-btn ${activeTab === 'governance' ? 'active' : ''}`}
                onClick={() => setActiveTab('governance')}
              >
                Governance & Voting
              </button>
            </div>

            {/* Tab 1: About */}
            {activeTab === 'about' && (
              <div className="tab-panel active">
                <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {c.description}
                </div>
              </div>
            )}

            {/* Tab 2: Donors */}
            {activeTab === 'donors' && (
              <div className="tab-panel active">
                <div style={{ padding: '1rem 0' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    All donors receive verifiable on-chain SVG NFT receipts recorded on Mantle Sepolia.
                  </p>
                  {campaignDonations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      <h4 style={{ marginBottom: '0.5rem' }}>No donations yet</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Be the first to support this campaign and receive an on-chain NFT receipt!
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {campaignDonations.map((d, idx) => {
                        const donorBadge = getDonorBadge(d.amount);
                        return (
                          <div
                            key={`${d.donor}-${d.timestamp}-${idx}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '1rem',
                              borderRadius: '12px',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  ...avatarStyle(d.donor),
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                }}
                              >
                                {initials(d.donor)}
                              </div>
                              <div>
                                <Link href={`/profile?address=${d.donor}`} style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                  {shortAddr(d.donor)}
                                </Link>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {donorBadge.label} Tier · {new Date(d.timestamp * 1000).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--teal)' }}>
                              +{formatMnt(d.amount)} MNT
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Governance */}
            {activeTab === 'governance' && (
              <div className="tab-panel active">
                <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Community Opinion</span>
                  <span className="badge badge-teal" style={{ fontSize: '0.75rem' }}>Zero Gas Fee</span>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Share your opinion to indicate which individual campaigns need funding the most. Voting is completely free and requires zero blockchain transaction fees.
                </p>

                {(() => {
                  const totalVotes = totalUp + totalDown;
                  const upPct = totalVotes > 0 ? Math.round((totalUp / totalVotes) * 100) : 50;

                  const isFlagged = totalDown >= 3 && totalDown > totalUp;
                  const isEndorsed = totalUp >= 5 && totalUp > totalDown * 2;
                  const votingDisabled = isEnded || pct >= 100 || isCancelled || c.withdrawn;

                  return (
                    <>
                      {isFlagged ? (
                        <div
                          style={{
                            background: 'rgba(255, 71, 87, 0.1)',
                            border: '1px solid rgba(255, 71, 87, 0.35)',
                            borderRadius: '10px',
                            padding: '0.85rem 1rem',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            color: '#ff6b81',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                          <span>Community Status: <strong>Flagged for Caution</strong> ({totalDown} against vs {totalUp} supporting)</span>
                        </div>
                      ) : isEndorsed ? (
                        <div
                          style={{
                            background: 'rgba(0, 212, 170, 0.1)',
                            border: '1px solid rgba(0, 212, 170, 0.35)',
                            borderRadius: '10px',
                            padding: '0.85rem 1rem',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            color: 'var(--teal)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>✓</span>
                          <span>Community Status: <strong>Verified Endorsement</strong> ({upPct}% positive consensus)</span>
                        </div>
                      ) : (
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            padding: '0.85rem 1rem',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                          }}
                        >
                          <span>ℹ️</span>
                          <span>Community Status: <strong>Open Consensus</strong> ({totalVotes} votes registered)</span>
                        </div>
                      )}

                      <div className="vote-bar-wrap" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--teal)' }}>Support ({totalUp})</span>
                          <span style={{ fontWeight: 600, color: '#ff4757' }}>Against ({totalDown})</span>
                        </div>
                        <div className="vote-bar-outer">
                          <div
                            className="vote-bar-inner"
                            style={{
                              width: `${upPct}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {votingDisabled ? (
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            padding: '1rem 1.25rem',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem',
                          }}
                        >
                          🔒 Voting is closed — this campaign has {isCancelled ? 'been cancelled' : pct >= 100 ? 'reached its goal' : 'ended'}.
                          {userVote && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              Your vote: <strong style={{ color: userVote === 'up' ? 'var(--teal)' : '#ff4757' }}>{userVote === 'up' ? 'Supported' : 'Against'}</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <button
                            className={`btn ${userVote === 'up' ? 'btn-primary' : 'btn-outline'}`}
                            style={userVote === 'up' ? { boxShadow: '0 0 15px rgba(0,212,170,0.4)' } : {}}
                            onClick={() => handleVote(true)}
                          >
                            {userVote === 'up' ? '✓ Supported' : 'Support Campaign'}
                          </button>
                          <button
                            className={`btn ${userVote === 'down' ? 'btn-danger' : 'btn-outline'}`}
                            style={userVote === 'down' ? { background: '#ff4757', borderColor: '#ff4757', color: '#fff' } : {}}
                            onClick={() => handleVote(false)}
                          >
                            {userVote === 'down' ? '✓ Voted Against' : 'Vote Against'}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Creator Controls */}
            {isOwner && (
              <div className="card" style={{ padding: '1.5rem', marginTop: '2rem', borderColor: 'rgba(0,212,170,0.3)' }}>
                <h4 style={{ color: 'var(--teal)', marginBottom: '0.75rem' }}>Creator Management Controls</h4>
                {isCancelled ? (
                  <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(255, 71, 87, 0.12)', border: '1px solid #ff4757', borderRadius: '10px', color: '#ff4757', fontWeight: 600, fontSize: '0.9rem' }}>
                    Campaign Cancelled — All donor funds have been automatically refunded.
                  </div>
                ) : (
                  <>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                      You are the creator of this campaign. You can withdraw funds once the goal is reached or deadline has passed.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary"
                        disabled={!canWithdraw || isWithdrawing || isWaitingWithdraw}
                        onClick={handleWithdraw}
                      >
                        {isWithdrawing || isWaitingWithdraw ? 'Withdrawing...' : 'Withdraw Funds'}
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={!c.active || isCancelling || isWaitingCancel}
                        onClick={handleCancel}
                      >
                        {isCancelling || isWaitingCancel ? 'Cancelling...' : 'Cancel & Refund Donors'}
                      </button>
                    </div>
                    {c.withdrawn && (
                      <p style={{ color: 'var(--teal)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                        Funds have been withdrawn
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Donate Card */}
          <div className="sticky">
            <div className="card donate-card">
              <h3 style={{ marginBottom: '1rem' }}>Make a Donation</h3>

              {isCancelled ? (
                <div className="badge badge-danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                  This campaign was cancelled and refunded
                </div>
              ) : isEnded || c.withdrawn ? (
                <div className="badge badge-gray" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                  This campaign is no longer accepting donations
                </div>
              ) : (
                <>
                  <div className="amount-presets" style={{ marginBottom: '1.25rem' }}>
                    {['0.01', '0.05', '0.1', '0.5', '1', '5'].map((amt) => (
                      <button
                        key={amt}
                        className={`amount-preset ${donationAmount === amt ? 'active' : ''}`}
                        onClick={() => setDonationAmount(amt)}
                      >
                        {amt} MNT
                      </button>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Custom Amount (MNT)</label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.0"
                        min="0.001"
                        step="0.001"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                      />
                      <span className="input-addon">MNT</span>
                    </div>
                  </div>

                  {/* Dynamic Tier Preview */}
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>NFT Receipt Tier:</span>
                    <span className={`badge ${previewBadge.color}`} style={{ fontWeight: 700 }}>
                      {previewBadge.label}
                    </span>
                  </div>

                  <button
                    className="btn btn-primary w-full btn-lg"
                    disabled={isDonating || isWaitingDonate}
                    onClick={handleDonate}
                  >
                    {isDonating || isWaitingDonate ? 'Processing Donation...' : 'Donate Now'}
                  </button>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
                    Automatic on-chain SVG NFT receipt minted to your wallet
                  </p>
                </>
              )}

              <div className="divider" style={{ margin: '1.5rem 0' }}></div>

              <div className="donate-stats">
                <div className="donate-stat-item">
                  <div className="donate-stat-value">{raisedStr}</div>
                  <div className="donate-stat-label">MNT Raised</div>
                </div>
                <div className="donate-stat-item">
                  <div className="donate-stat-value">{c.donorCount || 0}</div>
                  <div className="donate-stat-label">Donors</div>
                </div>
                <div className="donate-stat-item">
                  <div className="donate-stat-value">{pct}%</div>
                  <div className="donate-stat-label">Funded</div>
                </div>
                <div className="donate-stat-item">
                  <div className="donate-stat-value">{formatTimeLeft(c.deadline, c).split(' ')[0]}</div>
                  <div className="donate-stat-label">{getCampaignStatus(c) === 'active' ? (formatTimeLeft(c.deadline, c).includes('d') ? 'Days Left' : 'Time Left') : 'Status'}</div>
                </div>
              </div>

              <div className="divider" style={{ margin: '1.5rem 0' }}></div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <p>Funds secured by smart contract escrow on Mantle Sepolia</p>
                <p style={{ marginTop: '0.4rem' }}>Tiered on-chain SVG receipt minted with dynamic metadata</p>
                <p style={{ marginTop: '0.4rem' }}>Near-zero gas fees powered by Mantle L2</p>
              </div>
            </div>

            {/* Share Card */}
            <div className="card" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Share Cause</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={shareTwitter}>
                  Twitter
                </button>
                <button className="btn btn-secondary btn-sm" onClick={copyLink}>
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
