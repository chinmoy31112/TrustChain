import React, { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi';
import { CHARITY_FUND_ABI, CONTRACT_ADDRESSES } from '../config/contracts';
import { DEMO_CAMPAIGNS, DEMO_LEADERBOARD, CampaignData } from '../config/demoData';
import { TARGET_CHAIN_ID } from '../config/wagmi';

export function useFundContractAddress() {
  const chainId = useChainId();
  return CONTRACT_ADDRESSES[5003]?.CharityFund;
}

// Live baseline on-chain snapshot for contract 0x4F0F20682ae2e929c07c37b4964a07163aDBFc18 on Mantle Sepolia
export const ONCHAIN_BASELINE_CAMPAIGNS: CampaignData[] = [
  {
    id: 2,
    creator: '0x621121F08BC8eedF55D8bF0eC2f5014692c44c0f',
    title: 'Testing',
    description: 'Creating for testing purpose',
    category: 'Technology',
    imageUrl: 'https://www.testingtime.com/app/uploads/2017/07/Grundregeln_fuer_User_Testing.jpg',
    ipfsHash: '',
    goal: 10000000000000000000n, // 10 MNT
    raised: 5000000000000000000n, // 5 MNT
    deadline: 1793284835,
    withdrawn: false,
    active: true,
    donorCount: 1,
    voteCount: 0,
    againstCount: 0,
    createdAt: 1788100835,
    status: 0,
  },
  {
    id: 1,
    creator: '0x621121F08BC8eedF55D8bF0eC2f5014692c44c0f',
    title: 'Testing',
    description: 'Testing TrustChain Project',
    category: 'Other',
    imageUrl: 'https://share.google/W6PREiENCcGCWZODV',
    ipfsHash: '',
    goal: 10000000000000000000n,
    raised: 0n,
    deadline: 1796717321,
    withdrawn: false,
    active: false,
    donorCount: 0,
    voteCount: 0,
    againstCount: 0,
    createdAt: 1788077321,
    status: 2,
  },
];

export const ONCHAIN_BASELINE_STATS = {
  campaigns: 1,
  raised: 5000000000000000000n, // 5 MNT
  donors: 1,
};

export const ONCHAIN_BASELINE_LEADERBOARD = [
  {
    address: '0x621121F08BC8eedF55D8bF0eC2f5014692c44c0f' as `0x${string}`,
    total: 5000000000000000000n,
    count: 1,
    badge: 'Donor',
  },
];

export function useAllCampaigns() {
  const fundAddress = useFundContractAddress();

  const { data, isLoading, isError, refetch } = useReadContract({
    address: fundAddress,
    abi: CHARITY_FUND_ABI,
    functionName: 'getAllCampaigns',
    query: {
      enabled: Boolean(fundAddress && fundAddress !== '0x0000000000000000000000000000000000000000'),
      retry: 1,
      retryDelay: 2000,
      staleTime: 60_000,
    },
  });

  const [cachedList, setCachedList] = useState<CampaignData[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('trustchain_cached_campaigns');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((c: any) => ({
              ...c,
              goal: BigInt(c.goal || '0'),
              raised: BigInt(c.raised || '0'),
            }));
          }
        }
      } catch {}
    }
    return ONCHAIN_BASELINE_CAMPAIGNS;
  });

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      try {
        const serialized = data.map((c: any) => ({
          id: Number(c.id),
          creator: c.creator,
          title: c.title,
          description: c.description,
          category: c.category,
          imageUrl: c.imageUrl,
          ipfsHash: c.ipfsHash,
          goal: c.goal?.toString() || '0',
          raised: c.raised?.toString() || '0',
          deadline: Number(c.deadline),
          withdrawn: Boolean(c.withdrawn),
          active: Boolean(c.active),
          donorCount: Number(c.donorCount),
          voteCount: Number(c.voteCount),
          againstCount: Number(c.againstCount),
          createdAt: Number(c.createdAt),
          status: Number(c.status),
        }));
        localStorage.setItem('trustchain_cached_campaigns', JSON.stringify(serialized));
        setCachedList(
          data.map((c: any) => ({
            id: Number(c.id),
            creator: c.creator,
            title: c.title,
            description: c.description,
            category: c.category,
            imageUrl: c.imageUrl,
            ipfsHash: c.ipfsHash,
            goal: BigInt(c.goal?.toString() || '0'),
            raised: BigInt(c.raised?.toString() || '0'),
            deadline: Number(c.deadline),
            withdrawn: Boolean(c.withdrawn),
            active: Boolean(c.active),
            donorCount: Number(c.donorCount),
            voteCount: Number(c.voteCount),
            againstCount: Number(c.againstCount),
            createdAt: Number(c.createdAt),
            status: Number(c.status),
          }))
        );
      } catch {}
    }
  }, [data]);

  // Return fresh contract data, or instant baseline/cached data
  const campaigns: CampaignData[] = Array.isArray(data)
    ? data.map((c: any) => ({
        id: Number(c.id),
        creator: c.creator,
        title: c.title,
        description: c.description,
        category: c.category,
        imageUrl: c.imageUrl,
        ipfsHash: c.ipfsHash,
        goal: BigInt(c.goal?.toString() || '0'),
        raised: BigInt(c.raised?.toString() || '0'),
        deadline: Number(c.deadline),
        withdrawn: Boolean(c.withdrawn),
        active: Boolean(c.active),
        donorCount: Number(c.donorCount),
        voteCount: Number(c.voteCount),
        againstCount: Number(c.againstCount),
        createdAt: Number(c.createdAt),
        status: Number(c.status),
      }))
    : cachedList;

  const effectiveLoading = isError ? false : (isLoading && !data && cachedList.length === 0);

  return { campaigns, isLoading: effectiveLoading, isError, refetch };
}

export function useCampaign(id: number) {
  const fundAddress = useFundContractAddress();

  const { data, isLoading, isError, refetch } = useReadContract({
    address: fundAddress,
    abi: CHARITY_FUND_ABI,
    functionName: 'getCampaign',
    args: [BigInt(id)],
    query: {
      enabled: Boolean(fundAddress && id > 0),
      retry: 1,
      retryDelay: 2000,
    },
  });

  const campaign: CampaignData | null = data
    ? {
        id: Number((data as any).id),
        creator: (data as any).creator,
        title: (data as any).title,
        description: (data as any).description,
        category: (data as any).category,
        imageUrl: (data as any).imageUrl,
        ipfsHash: (data as any).ipfsHash,
        goal: BigInt((data as any).goal?.toString() || '0'),
        raised: BigInt((data as any).raised?.toString() || '0'),
        deadline: Number((data as any).deadline),
        withdrawn: Boolean((data as any).withdrawn),
        active: Boolean((data as any).active),
        donorCount: Number((data as any).donorCount),
        voteCount: Number((data as any).voteCount),
        againstCount: Number((data as any).againstCount),
        createdAt: Number((data as any).createdAt),
        status: Number((data as any).status),
      }
    : (ONCHAIN_BASELINE_CAMPAIGNS.find((c) => c.id === id) || null);

  const effectiveLoading = isError ? false : (isLoading && !data && !campaign);

  return { campaign, isLoading: effectiveLoading, isError, refetch };
}

export function usePlatformStats() {
  const fundAddress = useFundContractAddress();

  const { data, isLoading, refetch } = useReadContract({
    address: fundAddress,
    abi: CHARITY_FUND_ABI,
    functionName: 'getStats',
    query: {
      enabled: Boolean(fundAddress),
      retry: 1,
      retryDelay: 2000,
      staleTime: 60_000,
    },
  });

  const [cachedStats, setCachedStats] = useState<{ campaigns: number; raised: string; donors: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('trustchain_cached_platform_stats');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return {
      campaigns: ONCHAIN_BASELINE_STATS.campaigns,
      raised: ONCHAIN_BASELINE_STATS.raised.toString(),
      donors: ONCHAIN_BASELINE_STATS.donors,
    };
  });

  useEffect(() => {
    if (Array.isArray(data) && data.length === 3) {
      try {
        const rawCount = Number(data[0]);
        const activeCount = rawCount > 1 ? rawCount - 1 : rawCount;
        const statsObj = {
          campaigns: activeCount,
          raised: data[1]?.toString() || '0',
          donors: Number(data[2]),
        };
        localStorage.setItem('trustchain_cached_platform_stats', JSON.stringify(statsObj));
        setCachedStats(statsObj);
      } catch {}
    }
  }, [data]);

  if (Array.isArray(data) && data.length === 3) {
    const rawCount = Number(data[0]);
    const activeCount = rawCount > 1 ? rawCount - 1 : rawCount;
    return {
      campaigns: activeCount,
      raised: BigInt(data[1].toString()),
      donors: Number(data[2]),
      isLoading: false,
      refetch,
    };
  }

  return {
    campaigns: cachedStats.campaigns,
    raised: BigInt(cachedStats.raised),
    donors: cachedStats.donors,
    isLoading,
    refetch,
  };
}

export function useDonorStats(address?: `0x${string}`) {
  const fundAddress = useFundContractAddress();

  const { data, isLoading, refetch } = useReadContract({
    address: fundAddress,
    abi: CHARITY_FUND_ABI,
    functionName: 'getDonorStats',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(fundAddress && address),
      retry: 1,
    },
  });

  return {
    stats: data
      ? {
          wallet: (data as any).wallet,
          totalDonated: BigInt((data as any).totalDonated?.toString() || '0'),
          donationCount: Number((data as any).donationCount || 0),
          firstDonation: Number((data as any).firstDonation || 0),
          nftCount: Number((data as any).nftCount || 0),
        }
      : null,
    isLoading,
    refetch,
  };
}

export function useLeaderboard(limit = 10) {
  const fundAddress = useFundContractAddress();

  const { data, isLoading, refetch } = useReadContract({
    address: fundAddress,
    abi: CHARITY_FUND_ABI,
    functionName: 'getLeaderboard',
    args: [BigInt(limit)],
    query: {
      enabled: Boolean(fundAddress),
      retry: 1,
    },
  });

  const [cachedLeaderboard, setCachedLeaderboard] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('trustchain_cached_leaderboard');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((d: any) => ({
              ...d,
              total: BigInt(d.total || '0'),
            }));
          }
        }
      } catch {}
    }
    return ONCHAIN_BASELINE_LEADERBOARD;
  });

  useEffect(() => {
    if (Array.isArray(data) && data.length === 2 && Array.isArray(data[0]) && data[0].length > 0) {
      try {
        const wallets = data[0] as `0x${string}`[];
        const amounts = data[1] as bigint[];
        const list = wallets
          .map((w, idx) => ({
            address: w,
            total: BigInt(amounts[idx]?.toString() || '0'),
            count: 1,
            badge: 'Donor',
          }))
          .filter((d) => d.total > 0n);

        localStorage.setItem(
          'trustchain_cached_leaderboard',
          JSON.stringify(list.map((d) => ({ ...d, total: d.total.toString() })))
        );
        setCachedLeaderboard(list);
      } catch {}
    }
  }, [data]);

  let leaderboard: any[] = cachedLeaderboard;

  if (Array.isArray(data) && data.length === 2 && Array.isArray(data[0]) && data[0].length > 0) {
    const wallets = data[0] as `0x${string}`[];
    const amounts = data[1] as bigint[];
    leaderboard = wallets
      .map((w, idx) => ({
        address: w,
        total: BigInt(amounts[idx]?.toString() || '0'),
        count: 1,
        badge: 'Donor',
      }))
      .filter((d) => d.total > 0n);
  }

  const effectiveLoading = isLoading && !data && cachedLeaderboard.length === 0;

  return { leaderboard, isLoading: effectiveLoading, refetch };
}

export interface DonationRecord {
  campaignId: number;
  donor: `0x${string}`;
  amount: bigint;
  timestamp: number;
  nftTokenId: number;
}

export function useCampaignDonations(campaignId: number) {
  const fundAddress = useFundContractAddress();

  const { data, isLoading, refetch } = useReadContract({
    address: fundAddress,
    abi: CHARITY_FUND_ABI,
    functionName: 'getCampaignDonations',
    args: [BigInt(campaignId)],
    query: {
      enabled: Boolean(fundAddress && campaignId > 0),
      staleTime: 0,
      retry: 1,
      retryDelay: 2000,
    },
  });

  const donations: DonationRecord[] = Array.isArray(data)
    ? data.map((d: any) => ({
        campaignId: Number(d.campaignId),
        donor: d.donor as `0x${string}`,
        amount: BigInt(d.amount?.toString() || '0'),
        timestamp: Number(d.timestamp),
        nftTokenId: Number(d.nftTokenId),
      }))
    : [];

  return { donations, isLoading, refetch };
}

export function useUserDonations(userAddress?: `0x${string}`) {
  const fundAddress = useFundContractAddress();

  const { data, isLoading, refetch } = useReadContract({
    address: fundAddress,
    abi: CHARITY_FUND_ABI,
    functionName: 'getUserDonations',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(fundAddress && userAddress),
      staleTime: 0,
      retry: 1,
      retryDelay: 2000,
    },
  });

  const donations: DonationRecord[] = Array.isArray(data)
    ? data.map((d: any) => ({
        campaignId: Number(d.campaignId),
        donor: d.donor as `0x${string}`,
        amount: BigInt(d.amount?.toString() || '0'),
        timestamp: Number(d.timestamp),
        nftTokenId: Number(d.nftTokenId),
      }))
    : [];

  return { donations, isLoading, refetch };
}
