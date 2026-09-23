# TrustChain: Decentralized Charity Platform on Mantle Network

TrustChain is a decentralized crowdfunding and philanthropy platform deployed on Mantle Network. It replaces intermediary donation processors with automated smart contract escrow, transparent on-chain governance, and dynamic on-chain SVG NFT receipts minted directly to donors.

---

## Overview

Traditional charitable fundraising often suffers from high administrative overhead, opaque fund allocation, and risk of misappropriation. TrustChain addresses these challenges by leveraging Ethereum Layer-2 technology (Mantle Network) to offer:

1. Trustless Escrow: Donated funds remain locked in smart contract escrow until campaign milestones or deadlines are met.
2. Automated Refunds: If a campaign is cancelled by its creator, 100% of donor funds are unlocked for immediate withdrawal.
3. On-Chain SVG Receipts: Each contribution automatically mints an immutable ERC-721 receipt directly into the donor's wallet, with the artwork generated in pure Solidity code.
4. Gas Efficiency: Transactions execute on Mantle L2 rollups with near-zero gas fees, enabling micro-donations and macro-philanthropy without heavy network costs.
5. Real-Time Tracking: All platform statistics, campaigns, donor histories, and leaderboard rankings read live from the blockchain without intermediary database layers.

---

## Deployed Smart Contracts

The protocol is deployed and active on Mantle Sepolia Testnet.

| Contract | Network | Address | Explorer Link |
| :--- | :--- | :--- | :--- |
| CharityFund | Mantle Sepolia (5003) | `0x4F0F20682ae2e929c07c37b4964a07163aDBFc18` | [View on MantleScan](https://sepolia.mantlescan.xyz/address/0x4F0F20682ae2e929c07c37b4964a07163aDBFc18) |
| CharityNFT | Mantle Sepolia (5003) | `0x6eE3F2822A749E48346eEbe752E19141f295C3A7` | [View on MantleScan](https://sepolia.mantlescan.xyz/address/0x6eE3F2822A749E48346eEbe752E19141f295C3A7) |

---

## Core Architecture

The system consists of two primary smart contracts working in coordination with a Next.js 14 decentralized frontend:

### 1. CharityFund Contract (`CharityFund.sol`)
* Campaign Management: Handles campaign creation, target goal setting, duration validation, and category indexing.
* Financial Escrow: Holds all incoming MNT donations securely in contract custody.
* Creator Withdrawals: Allows campaign creators to withdraw accumulated funds only when the funding target has been satisfied or the campaign duration has concluded.
* Refund Mechanism: Implements an emergency cancellation mechanism where 100% of donated capital is made available for donor retrieval.
* Community Governance: Records gasless community sentiment and opinion votes for each campaign.
* Analytics: Aggregates total capital raised, active campaigns, unique donor metrics, and global donor leaderboards.

### 2. CharityNFT Contract (`CharityNFT.sol`)
* ERC-721 Enumerable: Standard-compliant non-fungible token contract providing public ownership records and wallet enumeration.
* Dynamic SVG Generation: Generates vector graphics, metadata badges, timestamps, amounts, and donor identifiers directly on-chain within Solidity using Base64 encoding.
* Tiered Badges: Assigns donor recognition tiers based on donation volume:
  * Bronze Tier: Minimum 0.001 MNT
  * Silver Tier: Minimum 0.01 MNT
  * Gold Tier: Minimum 0.1 MNT
  * Diamond Tier: Minimum 1.0 MNT

---

## Technology Stack

### Blockchain and Smart Contracts
* Network: Mantle Network (Mantle Sepolia Testnet / Mantle Mainnet)
* Language: Solidity 0.8.20
* Development Environment: Hardhat 2.19.4
* Libraries: OpenZeppelin Contracts v5.0 (ERC-721, Enumerable, Ownable, ReentrancyGuard)
* Testing: Chai, Hardhat Network Helpers, Hardhat Toolbox

### Frontend Application
* Framework: Next.js 14 (App Router architecture)
* Language: TypeScript
* Web3 Integration: Wagmi v3 / v2, Viem v2
* State Management: TanStack React Query v5
* Styling: Vanilla CSS custom design system (responsive glassmorphism, responsive navigation drawer, CSS Grid layout engine)
* Provider Discovery: EIP-6963 multi-injected provider detection with mobile deep-link intent handling

---

## Directory Structure

```
TrustChain-decentralized-Network/
├── contracts/
│   ├── CharityFund.sol            # Escrow vault, campaign registry, governance
│   └── CharityNFT.sol             # Dynamic on-chain SVG ERC-721 receipt engine
│
├── scripts/
│   ├── deploy.js                  # Automated contract deployment script
│   └── verify.js                  # Block explorer contract verification script
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with Web3 providers and navigation
│   │   ├── page.tsx               # Homepage with live on-chain stats and hero
│   │   ├── globals.css            # Global design system, glassmorphism, and responsive CSS
│   │   ├── campaigns/
│   │   │   └── page.tsx           # Campaign catalog with search, category & status filters
│   │   ├── campaign/[id]/
│   │   │   └── page.tsx           # Detailed campaign page, donation panel, creator controls
│   │   ├── create-campaign/
│   │   │   └── page.tsx           # Multi-step campaign launch form with validation
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Personal dashboard for user campaigns, donations, and NFTs
│   │   ├── leaderboard/
│   │   │   └── page.tsx           # Global donor rankings and podium
│   │   └── profile/
│   │       └── page.tsx           # Public address profile activity inspector
│   │
│   ├── components/
│   │   ├── Navbar.tsx             # Responsive header with network indicator and mobile drawer
│   │   ├── Footer.tsx             # Platform footer with protocol links and contract references
│   │   ├── WalletModal.tsx        # EIP-6963 wallet connection modal with mobile support
│   │   ├── SafeImage.tsx          # Resilient image loader with IPFS, proxy and fallback handlers
│   │   ├── NFTReceiptCard.tsx     # Display component for dynamic on-chain SVG receipts
│   │   ├── ParticleCanvas.tsx     # Lightweight canvas background particle animation
│   │   └── Toast.tsx              # Application toast notifications
│   │
│   ├── config/
│   │   ├── contracts.ts           # Deployed addresses, ABIs, categories, and tier definitions
│   │   ├── wagmi.ts               # Wagmi chain definitions, transports, and connectors
│   │   └── demoData.ts            # Type definitions and interfaces
│   │
│   ├── hooks/
│   │   ├── useCharityFund.ts      # Contract read/write hooks for campaigns, donations, stats
│   │   └── useCharityNFT.ts       # Contract read hooks for donor NFT tokens and SVG receipts
│   │
│   └── utils/
│       └── formatters.ts          # MNT unit conversion, address shortening, avatar generation
│
├── hardhat.config.js              # Hardhat compiler, network, and MantleScan settings
├── package.json                   # Project dependencies and operational scripts
├── tsconfig.json                  # TypeScript compiler configuration
└── README.md                      # Platform documentation
```

---

## Getting Started

### Prerequisites
* Node.js: version 18.0.0 or higher
* npm: version 9.0.0 or higher
* A Web3 wallet: MetaMask, Phantom, Coinbase Wallet, or any EIP-6963 compatible provider

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chinmoy31112/TrustChain-Decentralized-Network.git
cd TrustChain-Decentralized-Network
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Populate the following variables:
```ini
PRIVATE_KEY=your_wallet_private_key_without_0x
MANTLE_SEPOLIA_RPC=https://rpc.sepolia.mantle.xyz
MANTLE_MAINNET_RPC=https://rpc.mantle.xyz
MANTLE_API_KEY=your_mantlescan_api_key

# Optional frontend overrides
NEXT_PUBLIC_CHARITY_FUND_ADDRESS=0x4F0F20682ae2e929c07c37b4964a07163aDBFc18
NEXT_PUBLIC_CHARITY_NFT_ADDRESS=0x6eE3F2822A749E48346eEbe752E19141f295C3A7
```

### Local Development

Launch the Next.js development server:
```bash
npm run dev
```

The application will be accessible at:
```
http://localhost:3000
```

To test over a local network on mobile devices, connect your device to the same Wi-Fi network and access your local IP address:
```
http://<YOUR_LOCAL_IP>:3000
```

---

## Smart Contract Operations

### Compiling Contracts
```bash
npm run compile
```

### Running Automated Tests
```bash
npm run test
```

### Deploying to Mantle Sepolia Testnet
```bash
npm run deploy:testnet
```

### Deploying to Mantle Mainnet
```bash
npm run deploy:mainnet
```

### Verifying Contracts on MantleScan
```bash
npm run verify:testnet
```

---

## Network Configurations

### Mantle Sepolia Testnet (Current Deployment)
* Network Name: Mantle Sepolia
* Chain ID: 5003
* Currency: MNT
* RPC Endpoint: `https://rpc.sepolia.mantle.xyz`
* Block Explorer: `https://sepolia.mantlescan.xyz`
* Faucet: `https://faucet.sepolia.mantle.xyz`

### Mantle Mainnet (Production Target)
* Network Name: Mantle
* Chain ID: 5000
* Currency: MNT
* RPC Endpoint: `https://rpc.mantle.xyz`
* Block Explorer: `https://mantlescan.xyz`

---

## Application User Workflows

### For Donors
1. Connect Wallet: Select your installed extension on desktop, or open the link inside your mobile wallet app (e.g., MetaMask).
2. Select a Cause: Browse active campaigns using title search, category filters, and sorting parameters.
3. Contribute: Enter the desired contribution amount in MNT and confirm the transaction.
4. Receive NFT: The transaction completes in 1 to 2 seconds on Mantle L2, and an on-chain SVG certificate is minted to your address.
5. Track Impact: Inspect your historical contributions and NFT badges in the personal dashboard.

### For Campaign Creators
1. Launch Campaign: Navigate to "Start Campaign" and complete the three-step submission form (Title, Category, Description, Image URL, Goal, Duration).
2. Deploy On-Chain: Confirm the transaction to create the campaign record in the CharityFund contract.
3. Manage Escrow: Track incoming contributions in real-time. Once the funding goal is reached or the duration finishes, trigger the fund withdrawal directly to your wallet.
4. Cancellation Safety: If an emergency requires campaign termination, creators can trigger automated cancellations that allow all donors to retrieve their full contribution.

---

## Security Implementation

* ReentrancyGuard: Implemented on all state-modifying deposit, withdrawal, and refund routines.
* Checks-Effects-Interactions Pattern: State changes precede external value transfers to prevent reentrancy exploits.
* Access Control: Critical administrative functions are restricted through OpenZeppelin Ownable primitives.
* Strict Escrow Authorization: Fund withdrawals are strictly locked to the verified campaign creator and bounded by target metrics or expiration timestamps.
* Data Architecture: Frontend avoids stale cache flashing by fetching real-time on-chain data directly via wagmi contract hooks.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
