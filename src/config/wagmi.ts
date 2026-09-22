import { http, createConfig, injected } from 'wagmi';
import { mantleSepoliaTestnet } from 'wagmi/chains';

// Mantle Sepolia Testnet is the required primary network for development and testing
export const TARGET_CHAIN = mantleSepoliaTestnet;
export const TARGET_CHAIN_ID = mantleSepoliaTestnet.id; // 5003

export const wagmiConfig = createConfig({
  chains: [mantleSepoliaTestnet],
  connectors: [
    injected(),
  ],
  multiInjectedProviderDiscovery: true,
  transports: {
    [mantleSepoliaTestnet.id]: http('https://rpc.sepolia.mantle.xyz'),
  },
  ssr: true,
  // Reduce polling to minimize background RPC calls and improve performance
  pollingInterval: 15_000,
});
