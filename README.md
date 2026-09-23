# TrustChain

A decentralized crowdfunding and charity platform built on Mantle Network. It replaces traditional donation intermediaries with smart contract escrow, automated refunds, on-chain SVG NFT receipts, and community-driven fraud detection.

---

## Why TrustChain?

Traditional charity platforms take heavy cuts (5-10%), lack transparency on where funds go, and offer zero protection if a campaign turns out to be fake. TrustChain handles this entirely with smart contracts:

- **Escrow protection:** Donated MNT is locked in the contract. Creators cannot touch the money until the target goal is met or the campaign deadline passes.
- **Automated refunds:** If a campaign creator cancels a cause, 100% of the funds are unlocked for donors to withdraw. No middleman approval required.
- **On-chain SVG receipts:** Donors automatically receive an ERC-721 NFT receipt. The artwork is generated directly in Solidity bytecode—no IPFS gateways, no hosted images, no broken links.
- **Community sentiment & fraud warnings:** Users can vote to support or flag suspicious causes with zero gas fees. If a campaign accumulates heavy negative votes, a public skepticism warning is automatically displayed across the platform.
- **Low fees on Mantle L2:** Powered by Mantle Network rollups, transaction fees are negligible (fractions of a cent), making micro-donations practical.

---

## Deployed Contracts (Mantle Sepolia)

Both contracts are deployed and verified on Mantle Sepolia Testnet (Chain ID `5003`):

| Contract | Address | Explorer |
| :--- | :--- | :--- |
| **CharityFund** | `0x4F0F20682ae2e929c07c37b4964a07163aDBFc18` | [MantleScan](https://sepolia.mantlescan.xyz/address/0x4F0F20682ae2e929c07c37b4964a07163aDBFc18) |
| **CharityNFT** | `0x6eE3F2822A749E48346eEbe752E19141f295C3A7` | [MantleScan](https://sepolia.mantlescan.xyz/address/0x6eE3F2822A749E48346eEbe752E19141f295C3A7) |

---

## System Architecture

```
                    +------------------------------------+
                    |          TrustChain DApp           |
                    |    Next.js 14 + Wagmi + Viem       |
                    +---------+----------------+---------+
                              |                |
             On-chain actions |                | Zero-gas vote sync
            (donate/withdraw) |                |
                              v                v
                 +----------------------+   +---------------------+
                 |  Mantle Sepolia L2   |   |   Next.js Sync API  |
                 |                      |   |     (/api/votes)    |
                 |  +----------------+  |   +----------+----------+
                 |  | CharityFund    |  |              |
                 |  | - Escrow vault |  |              v
                 |  | - Campaigns    |  |   +---------------------+
                 |  | - Refunds      |  |   |   data/votes.json   |
                 |  +-------+--------+  |   | (cross-device state)|
                 |          | mint      |   +---------------------+
                 |          v           |
                 |  +----------------+  |
                 |  | CharityNFT     |  |
                 |  | - On-chain SVG |  |
                 |  | - ERC-721      |  |
                 |  +----------------+  |
                 +----------------------+
```

### 1. CharityFund (`contracts/CharityFund.sol`)
The central vault and operational contract:
- **Campaign Registry:** Stores campaign details (goal, deadline, creator, category, funds raised).
- **Escrow Vault:** Holds donated MNT in contract custody until withdrawal conditions are satisfied.
- **Creator Withdrawals:** Only the verified campaign creator can withdraw funds, and only after the goal is achieved or the duration ends.
- **Donor Refunds:** If a campaign is cancelled, donors can reclaim their exact contributed amount.
- **Platform Fee:** Fixed at 2.5% (250 basis points) for protocol sustainability, with a hardcoded cap at 10%.
- **Live Metrics:** Exposes view methods for total platform volume, active campaigns, unique donor count, and top donor leaderboards.

### 2. CharityNFT (`contracts/CharityNFT.sol`)
An ERC-721 Enumerable NFT contract that acts as an on-chain receipt engine:
- Generates dynamic SVGs completely inside Solidity using Base64 data URIs.
- Encodes donation amount, campaign ID, timestamp, and donor address into the visual artwork.
- Assigns badge tiers based on donation size:
  - **Bronze:** 0.001 - 0.01 MNT
  - **Silver:** 0.01 - 0.1 MNT
  - **Gold:** 0.1 - 1.0 MNT
  - **Diamond:** 1.0+ MNT

### 3. Real-Time Community Voting & Fraud Warnings
- **Zero Gas Fee:** Users can register support or flag a campaign without spending gas or signing transactions.
- **Cross-Device Sync:** Backed by a Next.js `/api/votes` route that syncs vote counts across browsers, phones, and devices in real time with optimistic UI updates.
- **Skepticism Alert System:** When a campaign receives 3 or more negative votes AND negative votes outnumber support votes (`Against >= 3` and `Against > Support`), the platform automatically:
  - Displays a red `Skepticism Alert` badge on the campaign card.
  - Adds a warning banner on the campaign detail page advising donors to verify credentials before contributing.
- **Voting Lifecycle:** Voting automatically closes when a campaign reaches its goal, expires, or gets cancelled.

---

## Tech Stack

- **Smart Contracts:** Solidity 0.8.20, Hardhat 2.19, OpenZeppelin Contracts v5 (ERC-721, ReentrancyGuard, Ownable, Pausable)
- **Blockchain:** Mantle Network (Sepolia Testnet & Mainnet ready)
- **Frontend:** Next.js 14 (App Router), TypeScript, Vanilla CSS (custom design system)
- **Web3 Client:** Wagmi v2, Viem v2, TanStack React Query v5
- **Wallet Connection:** EIP-6963 multi-injected discovery (MetaMask, Phantom, Coinbase Wallet, mobile deep linking)

---

## Project Structure

```
TrustChain-decentralized-Network/
├── contracts/
│   ├── CharityFund.sol            # Escrow vault, campaign registry, payouts
│   └── CharityNFT.sol             # Dynamic on-chain SVG ERC-721 receipt engine
├── data/
│   └── votes.json                 # Persistent community votes storage
├── scripts/
│   ├── deploy.js                  # Deployment script for Mantle
│   └── verify.js                  # MantleScan verification script
├── src/
│   ├── app/
│   │   ├── api/votes/route.ts     # Community voting sync API
│   │   ├── campaigns/page.tsx     # Explore campaigns, search, filters & skepticism alerts
│   │   ├── campaign/[id]/page.tsx # Campaign page, escrow progress, voting & donations
│   │   ├── create-campaign/page.tsx # Campaign launch form
│   │   ├── dashboard/page.tsx     # User's created causes, donations & NFT collection
│   │   ├── leaderboard/page.tsx   # Top donors podium & rankings
│   │   └── profile/page.tsx       # Public address activity inspector
│   ├── components/
│   │   ├── Navbar.tsx             # Responsive header with prefetching & mobile drawer
│   │   ├── WalletModal.tsx        # EIP-6963 wallet connection with MetaMask mobile support
│   │   ├── SafeImage.tsx          # Media loader with IPFS & proxy fallbacks
│   │   └── NFTReceiptCard.tsx     # Interactive viewer for on-chain SVG receipts
│   ├── hooks/
│   │   ├── useCharityFund.ts      # Contract hooks with in-memory caching for instant page loads
│   │   └── useCharityNFT.ts       # Hooks for donor NFT tokens and SVG metadata
│   ├── config/
│   │   ├── contracts.ts           # Contract ABIs, deployed addresses, categories & tiers
│   │   └── wagmi.ts               # Chain configurations, RPC transports & connectors
│   └── utils/
│       └── formatters.ts          # MNT formatting, address shortener, status helpers
├── hardhat.config.js              # Hardhat network & compiler configuration
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Web3 wallet (e.g. MetaMask)
- Testnet MNT from the [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz)

### 1. Install dependencies
```bash
git clone https://github.com/chinmoy31112/TrustChain-Decentralized-Network.git
cd TrustChain-Decentralized-Network
npm install
```

### 2. Configure environment
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Fill in your credentials:
```ini
PRIVATE_KEY=your_private_key_without_0x
MANTLESCAN_API_KEY=your_mantlescan_api_key
```

### 3. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing on Mobile (USB Tethering or Local Wi-Fi)

To test on your mobile device:
1. Find your machine's local IP address (`ipconfig` on Windows, `ifconfig` on Linux/macOS).
2. Open your mobile browser and navigate to:
   ```
   http://<YOUR_LOCAL_IP>:3000
   ```
3. Tap **Connect Wallet** and select **MetaMask Mobile**. The app will automatically open in MetaMask's in-app browser.
4. Donating, voting, and viewing NFT receipts work directly from mobile.

---

## Production Build & Instant Navigation

In development mode (`npm run dev`), Next.js compiles pages on demand. For best performance during interviews or demos, run the production build:

```bash
npm run build
npm run start
```

In production mode:
- Route prefetching (`prefetch={true}`) downloads page chunks in the background before you click.
- In-memory campaign caching renders campaign pages in **0ms** without loading spinners.

---

## Smart Contract Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Mantle Sepolia
npm run deploy:testnet

# Verify on MantleScan
npm run verify:testnet
```

---

## Security Considerations

- **Reentrancy Protection:** All functions handling transfers use OpenZeppelin's `ReentrancyGuard`.
- **Checks-Effects-Interactions:** State balances are updated before any native MNT is transferred.
- **Creator Lock:** Only the address that created a campaign can withdraw funds, and only after the goal or deadline condition is satisfied.
- **Clean Fallbacks:** Image errors, IPFS timeouts, and RPC network switches are handled gracefully in the UI.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
