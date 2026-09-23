'use client';

import React from 'react';
import { useReadContract, useChainId } from 'wagmi';
import { CHARITY_NFT_ABI, CONTRACT_ADDRESSES } from '../config/contracts';

export function useNFTContractAddress() {
  const chainId = useChainId();
  return CONTRACT_ADDRESSES[5003]?.CharityNFT;
}

export function useUserNFTTokens(userAddress?: `0x${string}`) {
  const nftAddress = useNFTContractAddress();

  const { data, isLoading, refetch } = useReadContract({
    address: nftAddress,
    abi: CHARITY_NFT_ABI,
    functionName: 'getDonorTokens',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(nftAddress && userAddress),
      staleTime: 5_000,
    },
  });

  const tokenIds: number[] = Array.isArray(data)
    ? (data as bigint[]).map((id) => Number(id))
    : [];

  return {
    tokenIds,
    isLoading: isLoading && !data,
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
