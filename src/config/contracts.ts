export const CONTRACT_ADDRESSES = {
  5003: {
    CharityFund: (process.env.NEXT_PUBLIC_CHARITY_FUND_ADDRESS || '0x4F0F20682ae2e929c07c37b4964a07163aDBFc18') as `0x${string}`,
    CharityNFT: (process.env.NEXT_PUBLIC_CHARITY_NFT_ADDRESS || '0x6eE3F2822A749E48346eEbe752E19141f295C3A7') as `0x${string}`,
  },
  // Mainnet entry ready for future production configuration
  5000: {
    CharityFund: '' as `0x${string}`,
    CharityNFT: '' as `0x${string}`,
  },
} as const;

export const CATEGORIES = [
  { label: 'All', icon: '', value: 'all' },
  { label: 'Education', icon: '', value: 'Education' },
  { label: 'Healthcare', icon: '', value: 'Healthcare' },
  { label: 'Disaster Relief', icon: '', value: 'Disaster Relief' },
  { label: 'Environment', icon: '', value: 'Environment' },
  { label: 'Hunger', icon: '', value: 'Hunger' },
  { label: 'Animal Welfare', icon: '', value: 'Animal Welfare' },
  { label: 'Community', icon: '', value: 'Community' },
  { label: 'Technology', icon: '', value: 'Technology' },
  { label: 'Other', icon: '', value: 'Other' },
] as const;

export const NFT_TIERS = {
  bronze: { min: 0.001, label: 'Bronze', color: '#CD7F32', badgeCls: 'badge-bronze' },
  silver: { min: 0.01, label: 'Silver', color: '#C0C0C0', badgeCls: 'badge-gray' },
  gold: { min: 0.1, label: 'Gold', color: '#FFD700', badgeCls: 'badge-gold' },
  diamond: { min: 1.0, label: 'Diamond', color: '#00D4AA', badgeCls: 'badge-teal' },
} as const;

export const CHARITY_FUND_ABI = [
  {
    inputs: [
      { name: "_title", type: "string" },
      { name: "_description", type: "string" },
      { name: "_category", type: "string" },
      { name: "_imageUrl", type: "string" },
      { name: "_ipfsHash", type: "string" },
      { name: "_goal", type: "uint256" },
      { name: "_durationDays", type: "uint256" }
    ],
    name: "createCampaign",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "_campaignId", type: "uint256" }],
    name: "donate",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ name: "_campaignId", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "_campaignId", type: "uint256" },
      { name: "_support", type: "bool" }
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "_campaignId", type: "uint256" }],
    name: "cancelCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "_id", type: "uint256" }],
    name: "getCampaign",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "title", type: "string" },
          { name: "description", type: "string" },
          { name: "category", type: "string" },
          { name: "imageUrl", type: "string" },
          { name: "ipfsHash", type: "string" },
          { name: "goal", type: "uint256" },
          { name: "raised", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "withdrawn", type: "bool" },
          { name: "active", type: "bool" },
          { name: "donorCount", type: "uint256" },
          { name: "voteCount", type: "uint256" },
          { name: "againstCount", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "status", type: "uint8" }
        ],
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getAllCampaigns",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "title", type: "string" },
          { name: "description", type: "string" },
          { name: "category", type: "string" },
          { name: "imageUrl", type: "string" },
          { name: "ipfsHash", type: "string" },
          { name: "goal", type: "uint256" },
          { name: "raised", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "withdrawn", type: "bool" },
          { name: "active", type: "bool" },
          { name: "donorCount", type: "uint256" },
          { name: "voteCount", type: "uint256" },
          { name: "againstCount", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "status", type: "uint8" }
        ],
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getActiveCampaigns",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "title", type: "string" },
          { name: "description", type: "string" },
          { name: "category", type: "string" },
          { name: "imageUrl", type: "string" },
          { name: "ipfsHash", type: "string" },
          { name: "goal", type: "uint256" },
          { name: "raised", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "withdrawn", type: "bool" },
          { name: "active", type: "bool" },
          { name: "donorCount", type: "uint256" },
          { name: "voteCount", type: "uint256" },
          { name: "againstCount", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "status", type: "uint8" }
        ],
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_id", type: "uint256" }],
    name: "getCampaignDonors",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_id", type: "uint256" }],
    name: "getCampaignDonations",
    outputs: [
      {
        components: [
          { name: "campaignId", type: "uint256" },
          { name: "donor", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "nftTokenId", type: "uint256" }
        ],
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_user", type: "address" }],
    name: "getUserCampaigns",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_user", type: "address" }],
    name: "getUserDonations",
    outputs: [
      {
        components: [
          { name: "campaignId", type: "uint256" },
          { name: "donor", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "nftTokenId", type: "uint256" }
        ],
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_donor", type: "address" }],
    name: "getDonorStats",
    outputs: [
      {
        components: [
          { name: "wallet", type: "address" },
          { name: "totalDonated", type: "uint256" },
          { name: "donationCount", type: "uint256" },
          { name: "firstDonation", type: "uint256" },
          { name: "nftCount", type: "uint256" }
        ],
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_limit", type: "uint256" }],
    name: "getLeaderboard",
    outputs: [
      { name: "wallets", type: "address[]" },
      { name: "amounts", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getStats",
    outputs: [
      { name: "totalCampaigns", type: "uint256" },
      { name: "totalRaised", type: "uint256" },
      { name: "totalDonors", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" }
    ],
    name: "hasVoted",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "campaignCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "title", type: "string" },
      { indexed: false, name: "category", type: "string" },
      { indexed: false, name: "goal", type: "uint256" },
      { indexed: false, name: "deadline", type: "uint256" }
    ],
    name: "CampaignCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "campaignId", type: "uint256" },
      { indexed: true, name: "donor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "tokenId", type: "uint256" },
      { indexed: false, name: "tier", type: "string" }
    ],
    name: "DonationMade",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "campaignId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "platformFee", type: "uint256" }
    ],
    name: "FundsWithdrawn",
    type: "event"
  }
] as const;

export const CHARITY_NFT_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_tokenId", type: "uint256" }],
    name: "getReceipt",
    outputs: [
      {
        components: [
          { name: "donor", type: "address" },
          { name: "campaignId", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "campaignTitle", type: "string" },
          { name: "tier", type: "string" }
        ],
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "_donor", type: "address" }],
    name: "getDonorTokens",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;
