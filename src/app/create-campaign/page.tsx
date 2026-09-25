'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther, decodeEventLog } from 'viem';
import { CHARITY_FUND_ABI, CATEGORIES } from '../../config/contracts';
import { useFundContractAddress } from '../../hooks/useCharityFund';
import { SafeImage, formatImageUrl, isWebpageUrl } from '../../components/SafeImage';
import { useToast } from '../../components/Toast';
import { TARGET_CHAIN_ID } from '../../config/wagmi';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const fundAddress = useFundContractAddress();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    imageUrl: '',
    ipfsHash: '',
    goal: '1.0',
    duration: '30',
  });

  const [imagePreviewState, setImagePreviewState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [imageFitMode, setImageFitMode] = useState<'contain' | 'cover'>('contain');

  useEffect(() => {
    const raw = formData.imageUrl.trim();
    if (!raw) {
      setImagePreviewState('idle');
      return;
    }
    if (isWebpageUrl(raw)) {
      setImagePreviewState('invalid');
      return;
    }

    setImagePreviewState('checking');
    const formatted = formatImageUrl(raw);
    const testImg = new Image();
    let isCancelled = false;

    testImg.onload = () => {
      if (!isCancelled) setImagePreviewState('valid');
    };
    testImg.onerror = () => {
      const proxy = `https://images.weserv.nl/?url=${encodeURIComponent(raw)}`;
      const proxyImg = new Image();
      proxyImg.onload = () => {
        if (!isCancelled) setImagePreviewState('valid');
      };
      proxyImg.onerror = () => {
        if (!isCancelled) setImagePreviewState('invalid');
      };
      proxyImg.src = proxy;
    };
    testImg.src = formatted;

    return () => {
      isCancelled = true;
    };
  }, [formData.imageUrl]);

  const { data: txHash, writeContract, isPending: isDeploying } = useWriteContract();
  const { isLoading: isWaitingReceipt, isSuccess: isDeploySuccess, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handledReceiptRef = useRef(false);

  useEffect(() => {
    if (isDeploySuccess && receipt && !handledReceiptRef.current) {
      handledReceiptRef.current = true;
      try {
        localStorage.removeItem('trustchain_cached_campaigns');
        localStorage.removeItem('trustchain_cached_platform_stats');
      } catch {}
      toast.success('Campaign deployed successfully on Mantle Sepolia!');
      
      // Try to parse CampaignCreated event
      let createdId: number | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = decodeEventLog({
            abi: CHARITY_FUND_ABI,
            data: log.data,
            topics: log.topics,
          });
          if ((parsed as any).eventName === 'CampaignCreated') {
            createdId = Number((parsed as any).args?.id);
            break;
          }
        } catch {}
      }

      setTimeout(() => {
        if (createdId && createdId > 0) {
          router.push(`/campaign/${createdId}`);
        } else {
          router.push('/campaigns');
        }
      }, 1200);
    }
  }, [isDeploySuccess, receipt, toast, router]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.title.trim() || formData.title.trim().length < 5) {
        toast.error('Title must be at least 5 characters');
        return false;
      }
      if (!formData.category) {
        toast.error('Please select a category');
        return false;
      }
      if (!formData.description.trim() || formData.description.trim().length < 20) {
        toast.error('Description must be at least 20 characters');
        return false;
      }
    }
    if (step === 2) {
      const g = parseFloat(formData.goal);
      if (isNaN(g) || g < 0.01) {
        toast.error('Goal amount must be at least 0.01 MNT');
        return false;
      }
      const d = parseInt(formData.duration);
      if (isNaN(d) || d < 1 || d > 365) {
        toast.error('Duration must be between 1 and 365 days');
        return false;
      }
      if (formData.imageUrl.trim() && isWebpageUrl(formData.imageUrl.trim())) {
        toast.error('The image URL is a social media webpage, not a photo file. Please provide a direct image link or leave it empty.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.warning('Please connect your wallet first');
      return;
    }

    if (chainId !== TARGET_CHAIN_ID) {
      toast.error('Please switch to Mantle Sepolia Testnet');
      return;
    }

    if (!fundAddress) {
      toast.error('Contract address not configured');
      return;
    }

    handledReceiptRef.current = false;

    (writeContract as any)(
      {
        address: fundAddress,
        abi: CHARITY_FUND_ABI,
        functionName: 'createCampaign',
        args: [
          formData.title.trim(),
          formData.description.trim(),
          formData.category,
          formatImageUrl(formData.imageUrl),
          formData.ipfsHash.trim(),
          parseEther(formData.goal),
          BigInt(formData.duration),
        ],
      },
      {
        onSuccess: () => {
          toast.info('Transaction confirmed by wallet. Waiting for on-chain confirmation...');
        },
        onError: (error: any) => {
          const msg = error?.shortMessage || error?.message || 'Failed to deploy campaign';
          if (msg.includes('User rejected') || msg.includes('denied')) {
            toast.warning('Transaction rejected by user');
          } else if (msg.includes('execution reverted') || msg.includes('could not coalesce')) {
            toast.error('Smart contract error — the CharityFund contract may not be deployed on Mantle Sepolia yet. Run: npm run deploy:testnet');
          } else {
            toast.error(msg);
          }
        },
      }
    );
  };

  const goalFloat = parseFloat(formData.goal || '0');
  const platformFee = goalFloat * 0.025;
  const netReceive = goalFloat - platformFee;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '780px' }}>
        <div className="page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="page-title">Start a Campaign</h1>
          <p className="page-desc">
            Launch your decentralized charity initiative on Mantle Network with automated escrow and NFT receipt issuance.
          </p>
        </div>

        {!isConnected && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Wallet Connection Required</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Connect your EVM wallet to Mantle Network to create and deploy campaigns on-chain.
            </p>
          </div>
        )}

        <div className="card" style={{ padding: '2.5rem' }}>
          {/* Step Indicators */}
          <div className="step-indicators" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', position: 'relative' }}>
            {[
              { step: 1, title: 'Basic Info' },
              { step: 2, title: 'Target & Media' },
              { step: 3, title: 'Review & Deploy' },
            ].map((s) => (
              <div
                key={s.step}
                className={`step-indicator ${currentStep === s.step ? 'active' : currentStep > s.step ? 'completed' : ''}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    background: currentStep >= s.step ? 'var(--teal)' : 'rgba(255,255,255,0.1)',
                    color: currentStep >= s.step ? '#07071a' : '#fff',
                    boxShadow: currentStep === s.step ? '0 0 16px rgba(0,212,170,0.5)' : 'none',
                  }}
                >
                  {currentStep > s.step ? '✓' : s.step}
                </div>
                <span style={{ fontSize: '0.8rem', color: currentStep >= s.step ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap', wordBreak: 'keep-all', textAlign: 'center' }}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="step-content active">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Campaign Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Clean Drinking Water for Eastern Villages"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                  />
                  <p className="form-hint">A clear, engaging headline (min. 5 characters)</p>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Category *</label>
                  <select
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    required
                  >
                    <option value="">Select a Category</option>
                    {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label">Campaign Description *</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    placeholder="Explain your mission, how the funds will be used, and the direct impact on beneficiaries..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    required
                  />
                  <p className="form-hint">Detailed breakdown of your charitable cause (min. 20 characters)</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-primary" onClick={nextStep}>
                    Next: Target & Media →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Target & Media */}
            {currentStep === 2 && (
              <div className="step-content active">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fundraising Target (MNT) *</label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="1.0"
                        min="0.01"
                        step="0.01"
                        value={formData.goal}
                        onChange={(e) => handleChange('goal', e.target.value)}
                        required
                      />
                      <span className="input-addon">MNT</span>
                    </div>
                    <p className="form-hint">Minimum 0.01 MNT</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration (Days) *</label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="30"
                        min="1"
                        max="365"
                        value={formData.duration}
                        onChange={(e) => handleChange('duration', e.target.value)}
                        required
                      />
                      <span className="input-addon">Days</span>
                    </div>
                    <p className="form-hint">Between 1 and 365 days</p>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Cover Image URL (Optional)</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://example.com/photo.jpg or ipfs://Qm..."
                    value={formData.imageUrl}
                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                  />
                  <p className="form-hint">Direct link to an image file (.jpg, .png, .webp) or IPFS CID</p>

                  {formData.imageUrl.trim() && isWebpageUrl(formData.imageUrl.trim()) && (
                    <div style={{ marginTop: '0.6rem', padding: '0.75rem 1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', fontSize: '0.82rem', color: '#fbbf24', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚠️</span>
                      <div>
                        <strong>Webpage link detected instead of direct image file.</strong>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.78rem', lineHeight: 1.4 }}>
                          Facebook, Instagram, and social media post links are HTML webpages that block image embedding. To use an image from a webpage, right-click the image and select <em>&ldquo;Copy Image Address&rdquo;</em> (which ends in .jpg, .png, etc.), or upload your image to an IPFS gateway or image host.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label className="form-label">IPFS Metadata Hash (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Qm... or bafy..."
                    value={formData.ipfsHash}
                    onChange={(e) => handleChange('ipfsHash', e.target.value)}
                  />
                  <p className="form-hint">Decentralized IPFS CID for extended documentation</p>
                </div>

                {formData.imageUrl.trim() && (
                  <div style={{ marginBottom: '2rem' }}>
                    {imagePreviewState === 'checking' && (
                      <div style={{ height: '140px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <span>Verifying image link...</span>
                      </div>
                    )}

                    {imagePreviewState === 'invalid' && (
                      <div style={{
                        padding: '1.25rem',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px dashed rgba(239, 68, 68, 0.35)',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>⚠️</div>
                        <div style={{ color: '#f87171', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                          Unable to load image from this URL
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                          Web browsers require a direct link to an image file (.jpg, .png, .webp) or an IPFS gateway. Webpages like Facebook posts do not serve raw image data. Please right-click the image and choose &ldquo;Copy Image Address&rdquo; or leave this field empty.
                        </p>
                      </div>
                    )}

                    {imagePreviewState === 'valid' && (
                      <div style={{
                        borderRadius: '14px',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid rgba(0, 229, 163, 0.35)',
                        background: '#070914',
                        minHeight: '260px',
                        maxHeight: '440px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {/* Ambient blurred backdrop for cohesive colors in empty letterbox areas */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: -20,
                            backgroundImage: `url(${formatImageUrl(formData.imageUrl)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(25px) brightness(0.25)',
                            opacity: 0.7,
                            pointerEvents: 'none',
                          }}
                        />

                        {/* Full Image */}
                        <SafeImage
                          src={formData.imageUrl}
                          alt="Campaign preview"
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            width: '100%',
                            maxHeight: '440px',
                            height: imageFitMode === 'cover' ? '320px' : 'auto',
                            objectFit: imageFitMode,
                            display: 'block',
                          }}
                        />

                        {/* View Mode Toggle */}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          zIndex: 3,
                          display: 'flex',
                          gap: '6px',
                        }}>
                          <button
                            type="button"
                            onClick={() => setImageFitMode(prev => prev === 'contain' ? 'cover' : 'contain')}
                            style={{
                              background: 'rgba(7, 7, 26, 0.85)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#cbd5e1',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s ease',
                            }}
                            title="Toggle between uncropped full image and banner crop"
                          >
                            <span>{imageFitMode === 'contain' ? '🖼️ Full View' : '📐 Banner View'}</span>
                          </button>
                        </div>

                        {/* Verified Badge */}
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          zIndex: 3,
                          background: 'rgba(7, 7, 26, 0.88)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: '#00e5a3',
                          border: '1px solid rgba(0,229,163,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        }}>
                          ✓ Image verified
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button type="button" className="btn btn-outline" onClick={prevStep}>
                    ← Back
                  </button>
                  <button type="button" className="btn btn-primary" onClick={nextStep}>
                    Next: Review & Deploy →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Deploy */}
            {currentStep === 3 && (
              <div className="step-content active">
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--teal)' }}>{formData.title}</h3>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-purple">{formData.category}</span>
                    <span className="badge badge-teal">{formData.duration} Days</span>
                    <span className="badge badge-gold">Target: {formData.goal} MNT</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>
                    {formData.description}
                  </p>

                  <div className="divider" style={{ margin: '1.25rem 0' }}></div>

                  {/* Fee Breakdown */}
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Target Goal:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formData.goal} MNT</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Platform Maintenance Fee (2.5%):</span>
                      <span style={{ color: '#ff6b81', fontWeight: 600 }}>-{platformFee.toFixed(4)} MNT</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', fontSize: '0.95rem' }}>
                      <span>Estimated Creator Payout:</span>
                      <span style={{ color: 'var(--teal)', fontWeight: 700 }}>{netReceive.toFixed(4)} MNT</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-outline" onClick={prevStep} disabled={isDeploying || isWaitingReceipt}>
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isDeploying || isWaitingReceipt || !isConnected}
                  >
                    {isDeploying || isWaitingReceipt ? 'Deploying On-Chain...' : 'Deploy Campaign On-Chain'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
