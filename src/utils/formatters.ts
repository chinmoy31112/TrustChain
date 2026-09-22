import { formatEther, parseEther } from 'viem';
import { NFT_TIERS } from '../config/contracts';

export function formatMnt(wei: bigint | string | number | undefined, decimals = 4): string {
  if (wei === undefined || wei === null) return '0';
  try {
    const weiBigInt = typeof wei === 'bigint' ? wei : BigInt(wei.toString());
    const ethVal = parseFloat(formatEther(weiBigInt));
    if (isNaN(ethVal)) return '0';
    return ethVal.toFixed(decimals).replace(/\.?0+$/, '') || '0';
  } catch {
    return '0';
  }
}

export function formatMntLabel(wei: bigint | string | number | undefined): string {
  if (!wei) return '0 MNT';
  try {
    const weiBigInt = typeof wei === 'bigint' ? wei : BigInt(wei.toString());
    const ethVal = parseFloat(formatEther(weiBigInt));
    if (ethVal >= 1000) return (ethVal / 1000).toFixed(2) + 'K MNT';
    return ethVal.toFixed(4).replace(/\.?0+$/, '') + ' MNT';
  } catch {
    return '0 MNT';
  }
}

export function shortAddr(addr?: string | null): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function calcProgress(raised: bigint | string | number, goal: bigint | string | number): number {
  try {
    const r = typeof raised === 'bigint' ? raised : BigInt(raised.toString());
    const g = typeof goal === 'bigint' ? goal : BigInt(goal.toString());
    if (g === 0n) return 0;
    const pct = Number((r * 100n) / g);
    return Math.min(pct, 100);
  } catch {
    return 0;
  }
}

export function formatTimeLeft(
  deadline: number | bigint,
  c?: {
    status?: number;
    active?: boolean;
    withdrawn?: boolean;
    deadline: number | bigint;
    raised?: bigint | string | number;
    goal?: bigint | string | number;
  }
): string {
  if (c) {
    const status = getCampaignStatus(c);
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'completed') return 'Goal Met';
    if (status === 'ended') return 'Ended';
  }
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(deadline) - now;
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export function getCategoryIcon(cat: string): string {
  return '';
}

export function getDonorBadge(amountWei: bigint | string | number) {
  try {
    const weiBigInt = typeof amountWei === 'bigint' ? amountWei : BigInt(amountWei.toString());
    const val = parseFloat(formatEther(weiBigInt));
    if (val >= NFT_TIERS.diamond.min) return { label: 'Diamond', color: 'badge-teal', icon: '' };
    if (val >= NFT_TIERS.gold.min) return { label: 'Gold', color: 'badge-gold', icon: '' };
    if (val >= NFT_TIERS.silver.min) return { label: 'Silver', color: 'badge-gray', icon: '' };
    return { label: 'Bronze', color: 'badge-bronze', icon: '' };
  } catch {
    return { label: 'Bronze', color: 'badge-bronze', icon: '' };
  }
}

export function getTierForAmount(amountMnt: number) {
  if (amountMnt >= NFT_TIERS.diamond.min) return NFT_TIERS.diamond;
  if (amountMnt >= NFT_TIERS.gold.min) return NFT_TIERS.gold;
  if (amountMnt >= NFT_TIERS.silver.min) return NFT_TIERS.silver;
  return NFT_TIERS.bronze;
}

export function avatarStyle(addr?: string | null): Record<string, string> {
  if (!addr) return {};
  const hue = parseInt(addr.slice(-4), 16) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 80) % 360}, 70%, 40%))`,
  };
}

export function initials(addr?: string | null): string {
  if (!addr) return '?';
  return addr.slice(2, 4).toUpperCase();
}

export function formatNum(n: number | string): string {
  const num = Number(n);
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

export function explorerTx(hash: string): string {
  return `https://sepolia.mantlescan.xyz/tx/${hash}`;
}

export function explorerAddress(addr: string): string {
  return `https://sepolia.mantlescan.xyz/address/${addr}`;
}

export type CampaignStatusType = 'active' | 'completed' | 'ended' | 'cancelled';

export function getCampaignStatus(c: {
  status?: number;
  active?: boolean;
  withdrawn?: boolean;
  deadline: number | bigint;
  raised?: bigint | string | number;
  goal?: bigint | string | number;
}): CampaignStatusType {
  // Solidity Enum: 0 = Active, 1 = Completed, 2 = Cancelled, 3 = Withdrawn
  if (c.status === 2) {
    return 'cancelled';
  }
  if (c.status === 1 || calcProgress(c.raised, c.goal) >= 100) {
    return 'completed';
  }
  if (c.status === 3 || c.withdrawn) {
    return 'ended';
  }
  const now = Math.floor(Date.now() / 1000);
  if (Number(c.deadline) < now || c.active === false) {
    return 'ended';
  }
  return 'active';
}

export function getCampaignStatusBadge(c: Parameters<typeof getCampaignStatus>[0]) {
  const status = getCampaignStatus(c);
  switch (status) {
    case 'cancelled':
      return { label: 'Cancelled', badgeCls: 'badge-danger', status };
    case 'completed':
      return { label: 'Goal Met', badgeCls: 'badge-gold', status };
    case 'ended':
      return { label: 'Ended', badgeCls: 'badge-gray', status };
    case 'active':
    default:
      return { label: 'Active', badgeCls: 'badge-teal', status };
  }
}
