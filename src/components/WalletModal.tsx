'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useConnect, useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { shortAddr } from '../utils/formatters';
import { TARGET_CHAIN_ID, TARGET_CHAIN } from '../config/wagmi';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DetectedWalletItem {
  id: string;
  name: string;
  badge: string;
  color: string;
  initial: string;
  iconUrl?: string;
  svgIcon?: React.ReactNode;
  connector?: any;
  isMobileAppOption?: boolean;
}

function safeCopyText(text: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (navigator && 'clipboard' in navigator && typeof navigator.clipboard?.writeText === 'function') {
      navigator.clipboard.writeText(text).catch(() => {});
      return true;
    }
  } catch {}
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

function getMetaMaskMobileLink(): string {
  if (typeof window === 'undefined') return 'metamask://';
  const host = window.location.host || 'localhost:3000';
  const pathname = window.location.pathname || '/';
  const search = window.location.search || '';
  
  // Format clean URL path (e.g. "10.224.4.42:3000/")
  let cleanUrl = (host + pathname + search).replace(/^https?:\/\//i, '');
  if (!cleanUrl.includes('/')) {
    cleanUrl += '/';
  }

  // Native custom scheme directly opens MetaMask app in-app browser on Android & iOS
  return `metamask://dapp/${cleanUrl}`;
}

function getWalletVisuals(rawName: string, iconUrl?: string) {
  const name = (rawName || '').trim() || 'Browser Wallet';
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
      badge: 'Detected',
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
      badge: 'Detected',
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

  if (lower.includes('rabby')) {
    return {
      name: 'Rabby Wallet',
      badge: 'Detected',
      color: '#8697FF',
      initial: 'R',
      iconUrl,
    };
  }

  if (lower.includes('okx') || lower.includes('okex')) {
    return {
      name: 'OKX Wallet',
      badge: 'Detected',
      color: '#FFFFFF',
      initial: 'O',
      iconUrl,
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
  const { connectors, connectAsync } = useConnect();
  const { isConnected, address, connector } = useAccount();
  const { disconnectAsync, disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const touchScreen = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 1024;
      setIsMobile(mobileUa || touchScreen);
    }
  }, []);

  // Reset internal states on open/close
  useEffect(() => {
    if (!isOpen) {
      setConnectingKey(null);
      setConnectError(null);
      setCopied(false);
      setShowMobileGuide(false);
    }
  }, [isOpen]);

  // Dynamically detect wallets:
  // On desktop: ONLY genuinely installed extension wallets (no fake/uninstalled ones)
  // On mobile: if inside an in-app browser (MetaMask/Phantom app), detect that wallet.
  //            if in external mobile browser (Chrome/Safari), present the mobile wallet app options (MetaMask & Phantom)
  const presentWallets = useMemo(() => {
    if (typeof window === 'undefined') return [];

    const discovered: DetectedWalletItem[] = [];
    const seenKeys = new Set<string>();

    // 1. Process EIP-6963 announced wallets (extensions actively installed and announcing themselves)
    const staticIds = new Set(['metamask', 'phantom', 'coinbasewallet', 'injected']);
    const eip6963Connectors = connectors.filter((c) => !staticIds.has((c.id || '').toLowerCase()));

    for (const c of eip6963Connectors) {
      const visuals = getWalletVisuals(c.name, c.icon);
      const key = visuals.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        discovered.push({
          id: c.id,
          connector: c,
          ...visuals,
          badge: 'Detected',
        });
      }
    }

    const eth = (window as any).ethereum;
    const providers: any[] = eth?.providers || (eth ? [eth] : []);

    // 2. Check Phantom presence (via window.phantom or ethereum)
    if (!seenKeys.has('phantom')) {
      const hasPhantom = !!(
        (window as any).phantom?.ethereum ||
        providers.some((p) => p.isPhantom)
      );

      if (hasPhantom) {
        seenKeys.add('phantom');
        const visuals = getWalletVisuals('Phantom');
        const conn =
          connectors.find((c) => c.id === 'phantom') ||
          connectors.find((c) => c.id === 'injected') ||
          connectors[0];
        discovered.push({
          id: 'phantom',
          connector: conn,
          ...visuals,
          badge: 'Detected',
        });
      }
    }

    // 3. Check MetaMask presence (MUST verify isMetaMask AND NOT phantom!)
    if (!seenKeys.has('metamask')) {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
      const isMMInApp = !!(
        eth?.isMetaMaskMobile ||
        (/MetaMask/i.test(ua) && eth?.isMetaMask)
      );
      const hasMM = !!(
        isMMInApp ||
        (eth?.isMetaMask && !eth?.isPhantom && !(window as any).phantom?.ethereum) ||
        providers.some((p) => p.isMetaMask && !p.isPhantom)
      );

      if (hasMM) {
        seenKeys.add('metamask');
        const visuals = getWalletVisuals('MetaMask');
        const conn =
          connectors.find((c) => c.id === 'metaMask') ||
          connectors.find((c) => c.id === 'injected') ||
          connectors[0];
        discovered.push({
          id: 'metamask',
          connector: conn,
          ...visuals,
          badge: isMMInApp ? 'In-App' : 'Detected',
        });
      }
    }

    // 4. Check Coinbase Wallet presence
    if (!seenKeys.has('coinbasewallet')) {
      const hasCoinbase = !!(
        (window as any).coinbaseWalletExtension ||
        providers.some((p) => p.isCoinbaseWallet && !p.isPhantom)
      );

      if (hasCoinbase) {
        seenKeys.add('coinbasewallet');
        const visuals = getWalletVisuals('Coinbase Wallet');
        const conn =
          connectors.find((c) => c.id === 'coinbaseWallet') ||
          connectors.find((c) => c.id === 'injected') ||
          connectors[0];
        discovered.push({
          id: 'coinbase',
          connector: conn,
          ...visuals,
          badge: 'Detected',
        });
      }
    }

    // 5. Check OKX / Rabby / Trust Wallet if present in providers
    if (providers.length > 0) {
      for (const p of providers) {
        if ((p.isOkxWallet || p.isOKExWallet) && !seenKeys.has('okxwallet')) {
          seenKeys.add('okxwallet');
          const visuals = getWalletVisuals('OKX Wallet');
          const conn = connectors.find((c) => c.id === 'injected') || connectors[0];
          discovered.push({ id: 'okx', connector: conn, ...visuals, badge: 'Detected' });
        } else if (p.isRabby && !seenKeys.has('rabbywallet')) {
          seenKeys.add('rabbywallet');
          const visuals = getWalletVisuals('Rabby Wallet');
          const conn = connectors.find((c) => c.id === 'injected') || connectors[0];
          discovered.push({ id: 'rabby', connector: conn, ...visuals, badge: 'Detected' });
        } else if ((p.isTrust || p.isTrustWallet) && !seenKeys.has('trustwallet')) {
          seenKeys.add('trustwallet');
          const visuals = getWalletVisuals('Trust Wallet');
          const conn = connectors.find((c) => c.id === 'injected') || connectors[0];
          discovered.push({ id: 'trust', connector: conn, ...visuals, badge: 'Detected' });
        }
      }
    }

    // 6. Generic single injected provider fallback (if on desktop with single unidentified injected wallet)
    if (discovered.length === 0 && !isMobile && eth) {
      const visuals = getWalletVisuals('Browser Wallet');
      const conn = connectors.find((c) => c.id === 'injected') || connectors[0];
      discovered.push({ id: 'injected', connector: conn, ...visuals, badge: 'Detected' });
    }

    return discovered;
  }, [connectors, isMobile]);

  // Disconnect handler
  const handleDisconnect = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDisconnecting(true);

    try {
      if (connector) {
        await disconnectAsync({ connector });
      }
    } catch (e1) {
      console.warn('Connector disconnect error:', e1);
    }

    try {
      await disconnectAsync();
    } catch (e2) {
      console.warn('Global disconnect error:', e2);
      try {
        disconnect();
      } catch {}
    }

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
      safeCopyText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Connection executor
  const handleConnectWallet = async (wallet: DetectedWalletItem) => {
    setConnectError(null);

    // If tapping a mobile app option in an external mobile browser (Chrome/Safari)
    if (wallet.isMobileAppOption) {
      if (wallet.name.toLowerCase().includes('meta')) {
        safeCopyText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);

        const targetLink = getMetaMaskMobileLink();
        window.location.href = targetLink;
        setShowMobileGuide(true);
        return;
      }
    }

    if (!wallet.connector) return;
    setConnectingKey(wallet.id);

    try {
      // Step 1: Connect accounts without forcing chainId to prevent mobile browser conflicts
      const result = await connectAsync({ connector: wallet.connector });

      // Step 2: Ensure on Mantle Sepolia (5003)
      if (result.chainId !== TARGET_CHAIN_ID && switchChainAsync) {
        try {
          await switchChainAsync({ chainId: TARGET_CHAIN_ID });
        } catch (switchErr: any) {
          console.warn('Switch chain note:', switchErr);
        }
      }

      onClose();
    } catch (err: any) {
      console.warn('Connect error:', err);
      let rawMsg = err?.message || 'Failed to connect wallet';
      const lower = rawMsg.toLowerCase();

      let msg = rawMsg;
      if (err?.code === 4001 || lower.includes('reject') || lower.includes('denied')) {
        msg = 'Connection request was cancelled in your wallet.';
      } else if (lower.includes('already pending')) {
        msg = 'A connection request is already pending. Please open your wallet to approve it.';
      } else if (lower.includes('provider not found') || lower.includes('providernotfound')) {
        msg = `${wallet.name} is not available in this browser.`;
      }
      setConnectError(msg);
    } finally {
      setConnectingKey(null);
    }
  };

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
                : 'Select your detected wallet to connect to Mantle Network'}
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
        ) : showMobileGuide ? (
          /* Mobile MetaMask Deep Link & Guidance View */
          <div style={{ padding: '1.75rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(226, 118, 37, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                border: '1px solid rgba(226, 118, 37, 0.3)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
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
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Connect with MetaMask Mobile
            </h3>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 212, 170, 0.12)', color: 'var(--teal)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, margin: '0.4rem auto 1rem auto', border: '1px solid rgba(0, 212, 170, 0.3)' }}>
              <span>✓</span> Link Copied to Clipboard
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Standard mobile browsers cannot run Web3 extensions. Connect directly through your <strong>MetaMask Mobile in-app browser</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <a
                href={getMetaMaskMobileLink()}
                onClick={(e) => {
                  safeCopyText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                  try {
                    window.location.href = getMetaMaskMobileLink();
                  } catch {}
                }}
                className="btn btn-primary w-full"
                style={{
                  textDecoration: 'none',
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span>🦊</span> Open in MetaMask Browser →
              </a>

              <button
                type="button"
                className="btn btn-outline w-full"
                onClick={() => {
                  safeCopyText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                style={{ padding: '0.75rem', fontSize: '0.88rem' }}
              >
                {copied ? '✓ Link Copied!' : '📋 Copy Website Link'}
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, border: '1px solid var(--border)', marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--teal)', display: 'block', marginBottom: '0.35rem' }}>3 Quick Steps:</strong>
              1. Tap <strong>Open MetaMask App</strong> above (or switch to MetaMask).<br />
              2. Tap the <strong>Browser icon (🧭 or 🌐)</strong> at the bottom of MetaMask.<br />
              3. <strong>Paste the link</strong> into the address bar to connect instantly!<br />
            </div>

            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowMobileGuide(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
              }}
            >
              ← Back to all wallets
            </button>
          </div>
        ) : presentWallets.length === 0 ? (
          /* When NO Web3 wallet is present in this browser or tab */
          <div style={{ padding: '1.75rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(0, 212, 170, 0.1)',
                color: 'var(--teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.1rem auto',
                border: '1px solid rgba(0, 212, 170, 0.25)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
                <circle cx="16" cy="14" r="1" fill="currentColor" />
              </svg>
            </div>

            <h4 style={{ marginBottom: '0.4rem', fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              {isMobile ? 'Connect Mobile Wallet' : 'No Wallet Detected'}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.55, marginBottom: '1.25rem' }}>
              {isMobile
                ? 'Mobile browsers (like Chrome) cannot run wallet extensions directly. Launch your MetaMask app or open this link inside your wallet browser to connect:'
                : 'No active Web3 wallet extension was detected in this browser. Install a browser extension or open this page in a Web3 wallet browser.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {isMobile && (
                <a
                  href={getMetaMaskMobileLink()}
                  onClick={(e) => {
                    safeCopyText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                    try {
                      window.location.href = getMetaMaskMobileLink();
                    } catch {}
                  }}
                  className="btn btn-primary w-full"
                  style={{
                    textDecoration: 'none',
                    padding: '0.85rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>🦊</span> Open in MetaMask Browser →
                </a>
              )}

              <button
                type="button"
                className={`btn ${isMobile ? 'btn-outline' : 'btn-primary'} w-full`}
                onClick={() => {
                  safeCopyText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                style={{ padding: '0.8rem', fontWeight: 700, fontSize: '0.9rem' }}
              >
                {copied ? '✓ Website Link Copied!' : '📋 Copy Website Link'}
              </button>
            </div>
          </div>
        ) : (
          /* List of Detected / Mobile Wallets */
          <div className="wc-list">
            {connectError && (
              <div
                style={{
                  margin: '0.4rem 0.4rem 0.6rem',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 71, 87, 0.12)',
                  border: '1px solid rgba(255, 71, 87, 0.3)',
                  color: '#ff6b81',
                  fontSize: '0.82rem',
                  lineHeight: 1.45,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <span>{connectError}</span>
                <button
                  type="button"
                  onClick={() => setConnectError(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff6b81',
                    cursor: 'pointer',
                    fontWeight: 700,
                    padding: '0.2rem',
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {presentWallets.map((wallet) => (
              <button
                key={wallet.id}
                type="button"
                className="wc-option"
                disabled={connectingKey !== null}
                onClick={() => handleConnectWallet(wallet)}
                style={{ cursor: connectingKey !== null ? 'wait' : 'pointer' }}
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
                <span className="wc-name">
                  {connectingKey === wallet.id ? `Connecting to ${wallet.name}...` : wallet.name}
                </span>
                <span className={`wc-badge ${wallet.badge === 'Mobile App' ? 'wc-fallback' : 'wc-detected'}`}>
                  {connectingKey === wallet.id ? (
                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, margin: 0 }}></div>
                  ) : (
                    wallet.badge
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        <p className="wc-footer">
          By connecting, you agree to interact with TrustChain smart contracts on {TARGET_CHAIN.name}.
        </p>
      </div>
    </div>
  );
}
