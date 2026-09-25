'use client';

import React, { useState, useEffect } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Clean neutral branded vector SVG fallback - no fake or random stock images
export const DEFAULT_FALLBACK =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450' width='800' height='450'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23080b18'/%3E%3Cstop offset='50%25' stop-color='%23121733'/%3E%3Cstop offset='100%25' stop-color='%230a0d1f'/%3E%3C/linearGradient%3E%3ClinearGradient id='accent' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%2300e5a3'/%3E%3Cstop offset='100%25' stop-color='%237b2bf9'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='450' fill='url(%23bg)'/%3E%3Ccircle cx='400' cy='195' r='50' fill='rgba(255,255,255,0.02)' stroke='rgba(255,255,255,0.08)' stroke-width='1.5'/%3E%3Cpath d='M380 215 L394 192 L406 205 L420 185 L436 215 Z' fill='none' stroke='url(%23accent)' stroke-width='2.5' stroke-linejoin='round' stroke-linecap='round'/%3E%3Ccircle cx='420' cy='175' r='3.5' fill='%2300e5a3'/%3E%3Ctext x='400' y='275' text-anchor='middle' fill='%237582a8' font-family='system-ui, -apple-system, sans-serif' font-size='13' font-weight='600' letter-spacing='2'%3ETRUSTCHAIN • DECENTRALIZED CHARITY%3C/text%3E%3C/svg%3E";

export function isWebpageUrl(url?: string): boolean {
  if (!url) return false;
  return (
    /facebook\.com\/(?!photo|image)/i.test(url) ||
    /instagram\.com\/(p|reel|tv)\//i.test(url) ||
    /twitter\.com\/.*\/status\//i.test(url) ||
    /x\.com\/.*\/status\//i.test(url) ||
    /linkedin\.com\/posts\//i.test(url) ||
    /tiktok\.com\/@/i.test(url) ||
    /youtube\.com\/watch/i.test(url)
  );
}

export function formatImageUrl(rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) return '';
  let url = rawUrl.trim();

  // If data URI or SVG, return directly
  if (url.startsWith('data:')) return url;

  // Ensure protocol
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('ipfs://')) {
    url = `https://${url}`;
  }

  // 1. IPFS Gateway Resolution (ipfs://CID, /ipfs/CID, or bare CID)
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  } else if (url.includes('/ipfs/')) {
    const cid = url.split('/ipfs/')[1];
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  } else if ((url.startsWith('Qm') && url.length === 46) || (url.startsWith('bafy') && url.length >= 50)) {
    return `https://gateway.pinata.cloud/ipfs/${url}`;
  }

  // 2. Google Drive & Google Share URLs
  if (url.includes('drive.google.com/file/d/')) {
    const fileId = url.split('drive.google.com/file/d/')[1]?.split('/')[0]?.split('?')[0];
    if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}`;
  } else if (url.includes('drive.google.com/uc') || url.includes('drive.google.com/open') || url.includes('google.com/file/d/')) {
    const match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }

  // 3. Dropbox Links
  if (url.includes('dropbox.com/')) {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com')
              .replace('dropbox.com', 'dl.dropboxusercontent.com')
              .replace('?dl=0', '?dl=1');
  }

  // 4. GitHub Blob URLs -> Raw Content CDN
  if (url.includes('github.com/') && url.includes('/blob/')) {
    return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }

  // 5. Unsplash Page URLs -> Direct Image CDN
  if (url.includes('unsplash.com/photos/')) {
    const photoId = url.split('unsplash.com/photos/')[1]?.split('/')[0]?.split('?')[0];
    if (photoId) return `https://images.unsplash.com/photo-${photoId}?w=800&auto=format&q=80`;
  }

  // 6. Imgur Page URLs -> Direct Image CDN
  if (url.includes('imgur.com/') && !url.includes('i.imgur.com')) {
    const imgurId = url.split('imgur.com/')[1]?.split('?')[0]?.split('#')[0];
    if (imgurId) return `https://i.imgur.com/${imgurId}.jpg`;
  }

  return url;
}

export function SafeImage({ src, alt, fallbackSrc, className, style, ...props }: SafeImageProps) {
  const fallback = fallbackSrc || DEFAULT_FALLBACK;
  const isCustomUserUrl = Boolean(src && src.trim() && src.trim() !== DEFAULT_FALLBACK && !src.startsWith('data:image/svg'));
  const formatted = formatImageUrl(src);
  const [imgSrc, setImgSrc] = useState<string>(formatted || fallback);
  const [errorCount, setErrorCount] = useState<number>(0);

  useEffect(() => {
    const f = formatImageUrl(src);
    setImgSrc(f || fallback);
    setErrorCount(0);
  }, [src, fallback]);

  const handleError = () => {
    const cleanUrl = (src || '').trim();
    if (errorCount === 0 && isCustomUserUrl) {
      setErrorCount(1);
      // Attempt 1: Fetch actual image pixels through global open-source image proxy (wsrv.nl)
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
      setImgSrc(proxyUrl);
    } else if (errorCount === 1 && isCustomUserUrl) {
      setErrorCount(2);
      // Attempt 2: Try secondary CORS image proxy
      const altProxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}`;
      setImgSrc(altProxyUrl);
    } else {
      setErrorCount(3);
      setImgSrc(fallback);
    }
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt || 'Campaign Image'}
      className={className}
      style={style}
      onError={handleError}
      {...props}
    />
  );
}

