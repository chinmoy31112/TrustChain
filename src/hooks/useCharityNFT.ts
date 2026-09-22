'use client';

import React, { useState, useEffect } from 'react';
import { useReadContract, useChainId } from 'wagmi';
import { CHARITY_NFT_ABI, CONTRACT_ADDRESSES } from '../config/contracts';

export function useNFTContractAddress() {
  const chainId = useChainId();
  return CONTRACT_ADDRESSES[5003]?.CharityNFT;
}

export const ONCHAIN_BASELINE_DONOR_ADDRESS = '0x621121f08bc8eedf55d8bf0ec2f5014692c44c0f';

export const ONCHAIN_BASELINE_USER_TOKENS: Record<string, number[]> = {
  [ONCHAIN_BASELINE_DONOR_ADDRESS]: [1],
};

export function useUserNFTTokens(userAddress?: `0x${string}`) {
  const nftAddress = useNFTContractAddress();
  const normalizedAddr = userAddress?.toLowerCase();

  const { data, isLoading, refetch } = useReadContract({
    address: nftAddress,
    abi: CHARITY_NFT_ABI,
    functionName: 'getDonorTokens',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(nftAddress && userAddress),
      staleTime: 60_000,
    },
  });

  const [cachedTokens, setCachedTokens] = useState<number[]>(() => {
    if (!normalizedAddr) return [];
    return ONCHAIN_BASELINE_USER_TOKENS[normalizedAddr] || [];
  });

  useEffect(() => {
    if (!normalizedAddr) {
      setCachedTokens([]);
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`trustchain_cached_nft_tokens_${normalizedAddr}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCachedTokens(parsed.map(Number));
            return;
          }
        }
      } catch {}
    }
    setCachedTokens(ONCHAIN_BASELINE_USER_TOKENS[normalizedAddr] || []);
  }, [normalizedAddr]);

  useEffect(() => {
    if (Array.isArray(data) && normalizedAddr) {
      try {
        const tokens = (data as bigint[]).map((id) => Number(id));
        localStorage.setItem(`trustchain_cached_nft_tokens_${normalizedAddr}`, JSON.stringify(tokens));
        setCachedTokens(tokens);
      } catch {}
    }
  }, [data, normalizedAddr]);

  const liveTokens = Array.isArray(data) ? (data as bigint[]).map((id) => Number(id)) : [];
  const tokenIds = liveTokens.length > 0 ? liveTokens : cachedTokens;
  const effectiveLoading = isLoading && !data && cachedTokens.length === 0;

  return {
    tokenIds,
    isLoading: effectiveLoading,
    refetch,
  };
}

export function useNFTReceipt(tokenId: number) {
  const nftAddress = useNFTContractAddress();

  const { data: receiptData, isLoading: isLoadingReceipt } = useReadContract({
    address: nftAddress,
    abi: CHARITY_NFT_ABI,
    functionName: 'getReceipt',
    args: tokenId > 0 ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: Boolean(nftAddress && tokenId > 0),
    },
  });

  const { data: tokenURI, isLoading: isLoadingURI } = useReadContract({
    address: nftAddress,
    abi: CHARITY_NFT_ABI,
    functionName: 'tokenURI',
    args: tokenId > 0 ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: Boolean(nftAddress && tokenId > 0),
    },
  });

  let svgData = '';
  let metadata: any = null;

  if (tokenURI && typeof tokenURI === 'string') {
    try {
      if (tokenURI.startsWith('data:application/json;base64,')) {
        const jsonBase64 = tokenURI.replace('data:application/json;base64,', '');
        const jsonStr = atob(jsonBase64);
        metadata = JSON.parse(jsonStr);
        if (metadata.image && metadata.image.startsWith('data:image/svg+xml;base64,')) {
          const svgBase64 = metadata.image.replace('data:image/svg+xml;base64,', '');
          svgData = atob(svgBase64);
        }
      }
    } catch (e) {
      console.error('Failed to decode on-chain SVG metadata:', e);
    }
  }

  return {
    receipt: receiptData
      ? {
          donor: (receiptData as any).donor,
          campaignId: Number((receiptData as any).campaignId),
          amount: BigInt((receiptData as any).amount?.toString() || '0'),
          timestamp: Number((receiptData as any).timestamp),
          campaignTitle: (receiptData as any).campaignTitle,
          tier: (receiptData as any).tier,
        }
      : null,
    metadata,
    svgData,
    isLoading: isLoadingReceipt || isLoadingURI,
  };
}
