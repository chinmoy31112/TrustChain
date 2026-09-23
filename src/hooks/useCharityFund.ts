import React, { useMemo } from 'react';
import { useReadContract, useChainId } from 'wagmi';
import { CHARITY_FUND_ABI, CONTRACT_ADDRESSES } from '../config/contracts';
import { CampaignData } from '../config/demoData';

export function useFundContractAddress() {
  const chainId = useChainId();
  return CONTRACT_ADDRESSES[5003]?.CharityFund;
}

export interface DonorStats {
  wallet: `0x${string}`;
  totalDonated: bigint;
  donationCount: number;
  firstDonation: number;
  nftCount: number;
}

export interface DonationRecord {
  campaignId: number;
  donor: `0x${string}`;
  amount: bigint;
  timestamp: number;
  nftTokenId: number;
}

export function useAllCampaigns() {
  const fundAddress = useFundContractAddress();

  const { data, isLoading, isError, refetch } = useReadContract({
    address: fundAddress,
    abi: CHARITY_FUND_ABI,
    functionName: 'getAllCampaigns',
    query: {
      enabled: Boolean(fundAddress && fundAddress !== '0x0000000000000000000000000000000000000000'),
      retry: 2,
      retryDelay: 1000,
      staleTime: 5_000,
    },
  });

  const campaigns: CampaignData[] = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((c: any) => ({
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
    }));
  }, [data]);

  return { campaigns, isLoading: isError ? false : (isLoading && !data), isError, refetch };
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
      retry: 2,
      retryDelay: 1000,
      staleTime: 5_000,
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
    : null;

  return { campaign, isLoading: isError ? false : (isLoading && !data), isError, refetch };
}

export function usePlatformStats() {
  const fundAddress = useFundContractAddress();

  const { data, isLoading, refetch } = useReadContract({
    address: fundAddress,
    abi: CHARITY_FUND_ABI,
    functionName: 'getStats',
    query: {
      enabled: Boolean(fundAddress),
      retry: 2,
      retryDelay: 1000,
      staleTime: 5_000,
    },
  });

  if (Array.isArray(data) && data.length === 3) {
    return {
      campaigns: Number(data[0]),
      raised: BigInt(data[1].toString()),
      donors: Number(data[2]),
      isLoading: false,
      refetch,
    };
  }

  return {
    campaigns: 0,
    raised: 0n,
    donors: 0,
    isLoading: isLoading && !data,
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
      retry: 2,
      staleTime: 5_000,
    },
  });

  const stats: DonorStats | null = data
    ? {
        wallet: (data as any).wallet as `0x${string}`,
        totalDonated: BigInt((data as any).totalDonated?.toString() || '0'),
        donationCount: Number((data as any).donationCount || 0),
        firstDonation: Number((data as any).firstDonation || 0),
        nftCount: Number((data as any).nftCount || 0),
      }
    : null;

  return {
    stats,
    isLoading: isLoading && !data,
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
      retry: 2,
      staleTime: 5_000,
    },
  });

  const leaderboard: any[] = useMemo(() => {
    if (Array.isArray(data) && data.length === 2 && Array.isArray(data[0]) && data[0].length > 0) {
      const wallets = data[0] as `0x${string}`[];
      const amounts = data[1] as bigint[];
      return wallets
        .map((w, idx) => ({
          address: w,
          total: BigInt(amounts[idx]?.toString() || '0'),
          count: 1,
          badge: 'Donor',
        }))
        .filter((d) => d.total > 0n);
    }
    return [];
  }, [data]);

  return { leaderboard, isLoading: isLoading && !data, refetch };
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
      retry: 2,
      retryDelay: 1000,
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
      staleTime: 5_000,
      retry: 2,
      retryDelay: 1000,
    },
  });

  const donations: DonationRecord[] = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((d: any) => ({
      campaignId: Number(d.campaignId),
      donor: d.donor as `0x${string}`,
      amount: BigInt(d.amount?.toString() || '0'),
      timestamp: Number(d.timestamp),
      nftTokenId: Number(d.nftTokenId),
    }));
  }, [data]);

  return { donations, isLoading: isLoading && !data, refetch };
}
