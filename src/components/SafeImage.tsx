'use client';

import React, { useState, useEffect } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&auto=format&q=80';

export function formatImageUrl(rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) return DEFAULT_FALLBACK;
  let url = rawUrl.trim();

  // If data URI or SVG, return directly
  if (url.startsWith('data:')) return url;

  // Ensure protocol
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('ipfs://')) {
    url = `https://${url}`;
  }

  // 1. IPFS Gateway Resolution (ipfs://CID or /ipfs/CID)
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  } else if (url.includes('/ipfs/')) {
    const cid = url.split('/ipfs/')[1];
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
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

  // 4. Unsplash Page URLs -> Direct Image CDN
  if (url.includes('unsplash.com/photos/')) {
    const photoId = url.split('unsplash.com/photos/')[1]?.split('/')[0]?.split('?')[0];
    if (photoId) return `https://images.unsplash.com/photo-${photoId}?w=800&auto=format&q=80`;
  }

  // 5. Imgur Page URLs -> Direct Image CDN
  if (url.includes('imgur.com/') && !url.includes('i.imgur.com')) {
    const imgurId = url.split('imgur.com/')[1]?.split('?')[0]?.split('#')[0];
    if (imgurId) return `https://i.imgur.com/${imgurId}.jpg`;
  }

  return url;
}

export function SafeImage({ src, alt, fallbackSrc, className, style, ...props }: SafeImageProps) {
  const isCustomUserUrl = Boolean(src && src.trim() && src.trim() !== DEFAULT_FALLBACK);
  const formatted = formatImageUrl(src);
  const [imgSrc, setImgSrc] = useState<string>(formatted);
  const [errorCount, setErrorCount] = useState<number>(0);

  useEffect(() => {
    setImgSrc(formatImageUrl(src));
    setErrorCount(0);
  }, [src]);

  const handleError = () => {
    const cleanUrl = (src || '').trim();
    if (errorCount === 0 && isCustomUserUrl) {
      setErrorCount(1);
      // Attempt 1: Fetch actual image pixels through global open-source image proxy (wsrv.nl)
      // This bypasses CORS, hotlink protection, and non-standard image headers to display the REAL image
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
      setImgSrc(proxyUrl);
    } else if (errorCount === 1 && isCustomUserUrl) {
      setErrorCount(2);
      // Attempt 2: Try secondary CORS image proxy
      const altProxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}`;
      setImgSrc(altProxyUrl);
    } else if (errorCount === 2 && isCustomUserUrl) {
      setErrorCount(3);
      // Attempt 3: Try raw src string directly
      setImgSrc(cleanUrl);
    } else {
      setErrorCount(4);
      setImgSrc(fallbackSrc || DEFAULT_FALLBACK);
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
