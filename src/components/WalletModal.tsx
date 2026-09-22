'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { shortAddr } from '../utils/formatters';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletItem {
  connector: any;
  name: string;
  badge: string;
  color: string;
  initial: string;
  iconUrl?: string;
  svgIcon?: React.ReactNode;
  key: string;
}

function detectInjectedWallet(eth: any): { name: string; key: string } {
  if (!eth) return { name: 'Browser Wallet', key: 'injected' };

  // 1. Phantom (EVM)
  if (typeof window !== 'undefined' && ((window as any).phantom?.ethereum || eth.isPhantom)) {
    return { name: 'Phantom', key: 'phantom' };
  }

  // 2. Coinbase Wallet
  if (eth.isCoinbaseWallet || (typeof window !== 'undefined' && (window as any).coinbaseWalletExtension)) {
    return { name: 'Coinbase Wallet', key: 'coinbase' };
  }

  // 3. OKX Wallet
  if (eth.isOkxWallet || eth.isOKExWallet) {
    return { name: 'OKX Wallet', key: 'okx' };
  }

  // 4. Rabby Wallet
  if (eth.isRabby) {
    return { name: 'Rabby Wallet', key: 'rabby' };
  }

  // 5. Trust Wallet
  if (eth.isTrust || eth.isTrustWallet) {
    return { name: 'Trust Wallet', key: 'trust' };
  }

  // 6. Brave Wallet
  if (eth.isBraveWallet) {
    return { name: 'Brave Wallet', key: 'brave' };
  }

  // 7. Bitget / BitKeep
  if (eth.isBitKeep || eth.isBitget) {
    return { name: 'Bitget Wallet', key: 'bitget' };
  }

  // 8. Zerion
  if (eth.isZerion) {
    return { name: 'Zerion Wallet', key: 'zerion' };
  }

  // 9. Rainbow
  if (eth.isRainbow) {
    return { name: 'Rainbow', key: 'rainbow' };
  }

  // 10. Backpack
  if (eth.isBackpack) {
    return { name: 'Backpack', key: 'backpack' };
  }

  // 11. MetaMask — only if NONE of the above wrappers are active
  if (eth.isMetaMask) {
    return { name: 'MetaMask', key: 'metamask' };
  }

  return { name: 'Browser Wallet', key: 'injected' };
}

function getWalletVisuals(rawName: string, iconUrl?: string) {
  const name = rawName.trim() || 'Browser Wallet';
  const lower = name.toLowerCase();

  if (lower.includes('phantom')) {
    return {
      name: 'Phantom',
      badge: 'Detected',
      color: '#AB9FF2',
      initial: 'P',
      iconUrl,
      svgIcon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6" fill="#AB9FF2" fillOpacity="0.2" />
          <path d="M12 4C7.58 4 4 7.58 4 12v6a2 2 0 0 0 3.4 1.4L9 18l1.6 1.4a2 2 0 0 0 2.8 0L15 18l1.6 1.4A2 2 0 0 0 20 18v-6c0-4.42-3.58-8-8-8Z" fill="#AB9FF2" />
          <circle cx="9.5" cy="11.5" r="1.5" fill="#0A0A23" />
          <circle cx="14.5" cy="11.5" r="1.5" fill="#0A0A23" />
        </svg>
      ),
    };
  }

  if (lower.includes('meta')) {
    return {
      name: 'MetaMask',
      badge: 'Popular',
      color: '#E27625',
      initial: 'M',
      iconUrl,
      svgIcon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="m21.2 7.6-7.4-5.4a2.8 2.8 0 0 0-3.6 0L2.8 7.6A2.8 2.8 0 0 0 1.6 10l2.7 8.2a2.8 2.8 0 0 0 2.2 1.9l4.5 1.1a3.6 3.6 0 0 0 1.9 0l4.5-1.1a2.8 2.8 0 0 0 2.2-1.9l2.7-8.2c.5-.8.4-1.8-.1-2.4Z"
            fill="#E27625"
            fillOpacity="0.2"
            stroke="#E27625"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="m7.5 11 3.5 3.5 3.5-3.5" stroke="#E27625" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8" cy="9.5" r="1.2" fill="#E27625" />
          <circle cx="16" cy="9.5" r="1.2" fill="#E27625" />
        </svg>
      ),
    };
  }

  if (lower.includes('coinbase')) {
    return {
      name: 'Coinbase Wallet',
      badge: 'Secure',
      color: '#0052FF',
      initial: 'C',
      iconUrl,
      svgIcon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#0052FF" fillOpacity="0.2" stroke="#0052FF" strokeWidth="1.5" />
          <rect x="8" y="8" width="8" height="8" rx="2" fill="#0052FF" />
        </svg>
      ),
    };
  }

  if (lower.includes('okx') || lower.includes('okex')) {
    return {
      name: 'OKX Wallet',
      badge: 'Detected',
      color: '#FFFFFF',
      initial: 'O',
      iconUrl,
      svgIcon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6" fill="#FFFFFF" fillOpacity="0.15" />
          <rect x="6" y="6" width="4" height="4" fill="#FFFFFF" />
          <rect x="14" y="6" width="4" height="4" fill="#FFFFFF" />
          <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
          <rect x="6" y="14" width="4" height="4" fill="#FFFFFF" />
          <rect x="14" y="14" width="4" height="4" fill="#FFFFFF" />
        </svg>
      ),
    };
  }

  if (lower.includes('rabby')) {
    return {
      name: 'Rabby Wallet',
      badge: 'Detected',
      color: '#8697FF',
      initial: 'R',
      iconUrl,
      svgIcon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#8697FF" fillOpacity="0.2" stroke="#8697FF" strokeWidth="1.5" />
          <path d="M7 14c1.5-3 3-5 5-5s3.5 2 5 5" stroke="#8697FF" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    };
  }

  if (lower.includes('trust')) {
    return {
      name: 'Trust Wallet',
      badge: 'Detected',
      color: '#0500FF',
      initial: 'T',
      iconUrl,
    };
  }

  if (lower.includes('brave')) {
    return {
      name: 'Brave Wallet',
      badge: 'Detected',
      color: '#FB542B',
      initial: 'B',
      iconUrl,
    };
  }

  if (lower.includes('bitget') || lower.includes('bitkeep')) {
    return {
      name: 'Bitget Wallet',
      badge: 'Detected',
      color: '#00F0FF',
      initial: 'B',
      iconUrl,
    };
  }

  return {
    name,
    badge: 'Detected',
    color: '#00D4AA',
    initial: name.charAt(0).toUpperCase(),
    iconUrl,
  };
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connectors, connect, isPending } = useConnect();
  const { isConnected, address, connector } = useAccount();
  const { disconnectAsync, disconnect } = useDisconnect();

  const [availableWallets, setAvailableWallets] = useState<WalletItem[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reliable instant disconnect on very first click
  const handleDisconnect = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDisconnecting(true);

    try {
      if (connector) {
        await disconnectAsync({ connector });
      }
    } catch (e1) {
      console.warn('Active connector disconnect error:', e1);
    }

    try {
      await disconnectAsync();
    } catch (e2) {
      console.warn('Global disconnect error:', e2);
      try {
        disconnect();
      } catch {}
    }

    // Clear wagmi localStorage keys so it never auto-reconnects
    try {
      if (typeof window !== 'undefined') {
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('wagmi') || key.includes('recentConnector'))) {
            toRemove.push(key);
          }
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch {}

    setIsDisconnecting(false);
    onClose();
  }, [connector, disconnectAsync, disconnect, onClose]);

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function detectWallets() {
      setIsChecking(true);

      const eth = typeof window !== 'undefined' ? (window as any).ethereum : null;
      const discovered: WalletItem[] = [];
      const seenKeys = new Set<string>();

      // 1. Process connectors reported by Wagmi (including EIP-6963 announced wallets)
      for (const conn of connectors) {
        const rawName = (conn.name || '').trim();
        let detectedName = rawName;
        const iconUrl = conn.icon;

        // If connector is generic 'Injected', accurately detect the real extension from window.ethereum
        if (!detectedName || detectedName.toLowerCase() === 'injected') {
          const detected = detectInjectedWallet(eth);
          detectedName = detected.name;
        }

        const visuals = getWalletVisuals(detectedName, iconUrl);
        const normKey = visuals.name.toLowerCase().replace(/[^a-z0-9]/g, '');

        const isEip6963 = Boolean(conn.id && conn.id.includes('.'));

        if (!seenKeys.has(normKey)) {
          seenKeys.add(normKey);
          discovered.push({
            connector: conn,
            key: normKey,
            ...visuals,
          });
        } else if (isEip6963) {
          // Prefer EIP-6963 connector
          const idx = discovered.findIndex((d) => d.key === normKey);
          if (idx !== -1) {
            discovered[idx] = {
              connector: conn,
              key: normKey,
              ...visuals,
            };
          }
        }
      }

      // 2. Check window.ethereum.providers array if multiple wallet extensions are installed
      if (eth?.providers && Array.isArray(eth.providers)) {
        for (const p of eth.providers) {
          const detected = detectInjectedWallet(p);
          const visuals = getWalletVisuals(detected.name);
          const pKey = visuals.name.toLowerCase().replace(/[^a-z0-9]/g, '');

          if (!seenKeys.has(pKey)) {
            seenKeys.add(pKey);
            const matchConn = connectors.find((c) =>
              (c.id + ' ' + c.name).toLowerCase().includes(pKey.slice(0, 4))
            ) || connectors[0];

            if (matchConn) {
              discovered.push({
                connector: matchConn,
                key: pKey,
                ...visuals,
              });
            }
          }
        }
      }

      // 3. Fallback: If discovered list is empty but window.ethereum or window.phantom exists
      if (discovered.length === 0 && (eth || (typeof window !== 'undefined' && (window as any).phantom?.ethereum)) && connectors.length > 0) {
        const detected = detectInjectedWallet(eth);
        const visuals = getWalletVisuals(detected.name);
        discovered.push({
          connector: connectors[0],
          key: visuals.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          ...visuals,
        });
      }

      if (isMounted) {
        setAvailableWallets(discovered);
        setIsChecking(false);
      }
    }

    detectWallets();

    return () => {
      isMounted = false;
    };
  }, [isOpen, connectors]);

  if (!isOpen) return null;

  return (
    <div
      className="wc-overlay"
      onClick={onClose}
      style={{
        zIndex: 10000,
        position: 'fixed',
        inset: 0,
      }}
    >
      <div
        className="wc-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 10001 }}
      >
        <div className="wc-header">
          <div>
            <h3 className="wc-title">{isConnected ? 'Wallet Connected' : 'Connect Wallet'}</h3>
            <p className="wc-subtitle">
              {isConnected
                ? `Connected as ${shortAddr(address)}`
                : 'Choose your wallet to connect to Mantle Network'}
            </p>
          </div>
          <button className="wc-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {isConnected ? (
          <div style={{ padding: '1.5rem 1.5rem 1.25rem' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Connected Address
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.92rem', wordBreak: 'break-all', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {address}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="btn btn-outline btn-sm"
                style={{ flexShrink: 0, padding: '0.4rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer' }}
                title="Copy Address"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-danger w-full"
              disabled={isDisconnecting}
              onClick={handleDisconnect}
              style={{
                padding: '0.85rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: isDisconnecting ? 'not-allowed' : 'pointer',
                position: 'relative',
                zIndex: 20,
              }}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect Wallet'}
            </button>
          </div>
        ) : (
          <div className="wc-list">
            {isChecking ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="spinner" style={{ margin: '0 auto 0.75rem auto' }}></div>
                <span style={{ fontSize: '0.85rem' }}>Detecting installed wallets...</span>
              </div>
            ) : availableWallets.length === 0 ? (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(0, 212, 170, 0.12)',
                    color: 'var(--teal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                  }}
                >
                  W
                </div>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  No Wallet Detected
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  No Web3 wallet was detected in your browser. Install an EVM wallet to interact on Mantle Network.
                </p>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full"
                  style={{ textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }}
                >
                  Install Wallet →
                </a>
              </div>
            ) : (
              availableWallets.map((wallet) => (
                <button
                  key={wallet.key}
                  type="button"
                  className="wc-option"
                  disabled={isPending}
                  onClick={() => {
                    connect({ connector: wallet.connector });
                    onClose();
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span
                    className="wc-icon"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: `${wallet.color}20`,
                      flexShrink: 0,
                    }}
                  >
                    {wallet.iconUrl ? (
                      <img
                        src={wallet.iconUrl}
                        alt={wallet.name}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'contain' }}
                      />
                    ) : wallet.svgIcon ? (
                      wallet.svgIcon
                    ) : (
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: wallet.color }}>
                        {wallet.initial}
                      </span>
                    )}
                  </span>
                  <span className="wc-name">{wallet.name}</span>
                  <span className="wc-badge wc-detected">{wallet.badge}</span>
                </button>
              ))
            )}
          </div>
        )}

        <p className="wc-footer">
          By connecting, you agree to interact with TrustChain smart contracts on Mantle Network.
        </p>
      </div>
    </div>
  );
}
