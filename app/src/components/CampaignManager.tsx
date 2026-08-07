import { useEffect, useState } from 'react';
import { useClient } from '@solana/react';
import type { Account, TransactionSigner } from '@solana/kit';
import type { AppClient } from '../client/client';
import { formatAddress, lamportsToSol } from '../client/campaigns';
import { userFacingError } from '../client/errors';
import { findCampaignPda, type Campaign } from '../client/generated';
import { CampaignForm } from './CampaignForm';
import { WithdrawPanel } from './WithdrawPanel';

export function CampaignManager({
  signer,
  refreshKey,
  onChanged,
}: {
  signer: TransactionSigner;
  refreshKey: number;
  onChanged: () => void;
}) {
  const client = useClient<AppClient>();
  const [campaign, setCampaign] = useState<Account<Campaign> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const [pda] = await findCampaignPda({ user: signer.address });
        const maybe = await client.crowdfunding.accounts.campaign.fetchMaybe(pda);
        if (cancelled) return;
        setCampaign(maybe.exists ? maybe : null);
        setError(null);
      } catch (cause) {
        if (!cancelled) {
          console.error('load your campaign failed:', cause);
          setError(userFacingError(cause));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, signer, refreshKey]);

  if (loading) {
    return (
      <div className="panel">
        <span className="muted">Checking for your campaign…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <span className="muted">Could not read your campaign: {error}</span>
      </div>
    );
  }

  if (campaign) {
    return (
      <div className="panel">
        <span className="card__flag">Yours</span>
        <h3 className="card__name">{campaign.data.name}</h3>
        <p style={{ margin: '0 0 18px' }}>{campaign.data.description}</p>
        <div className="card__foot">
          <span className="mono">{lamportsToSol(campaign.data.amountDonated).toFixed(3)} SOL raised</span>
          <span className="mono muted">admin {formatAddress(campaign.data.admin)}</span>
        </div>
        <WithdrawPanel campaign={campaign} signer={signer} onWithdrawn={onChanged} />
      </div>
    );
  }

  return (
    <div className="panel">
      <span className="label">You don't have a campaign yet — one per wallet.</span>
      <CampaignForm signer={signer} onCreated={onChanged} />
    </div>
  );
}
