'use client';

import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { TARGET_CHAIN_ID, TARGET_CHAIN } from '../config/wagmi';

export function WrongNetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === TARGET_CHAIN_ID) {
    return null;
  }

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #ff4757, #ff6b81)',
        color: '#fff',
        padding: '0.65rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        fontSize: '0.88rem',
        fontWeight: 600,
        position: 'sticky',
        top: 0,
        zIndex: 9998,
        boxShadow: '0 4px 20px rgba(255, 71, 87, 0.4)',
        textAlign: 'center',
        flexWrap: 'wrap',
      }}
    >
      <span>
        You are connected to an unsupported network (Chain ID: {chainId}). Please switch to {TARGET_CHAIN.name} to interact with TrustChain.
      </span>
      <button
        onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
        disabled={isPending}
        style={{
          background: '#fff',
          color: '#ff4757',
          border: 'none',
          padding: '4px 14px',
          borderRadius: '20px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {isPending ? 'Switching...' : `Switch to ${TARGET_CHAIN.name}`}
      </button>
    </div>
  );
}
