import { useCallback, useEffect, useState } from 'react';
import { useClient } from '@solana/react';
import type { Account, Address } from '@solana/kit';
import type { AppClient } from '../client/client';
import { listCampaigns } from '../client/campaigns';
import { userFacingError } from '../client/errors';
import type { Campaign } from '../client/generated';
import { CampaignCard, type Accent } from './CampaignCard';

const ACCENTS: Accent[] = ['acid', 'tomato', 'violet'];

export function CampaignList({
  refreshKey,
  myAddress,
}: {
  refreshKey: number;
  myAddress: Address | null;
}) {
  const client = useClient<AppClient>();
  const [campaigns, setCampaigns] = useState<Array<Account<Campaign>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await listCampaigns(client);
      setCampaigns(result);
      setError(null);
    } catch (cause) {
      console.error('load campaigns failed:', cause);
      setError(userFacingError(cause));
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (error) {
    return (
      <div className="panel">
        <span className="muted">Could not load campaigns: {error}</span>
      </div>
    );
  }

  if (campaigns === null) {
    return (
      <div className="panel">
        <span className="muted">Loading campaigns…</span>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="panel">
        <span className="muted">
          No campaigns yet — create the first one above.
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="list__toolbar">
        <span className="muted">
          {campaigns.length} campaign{campaigns.length === 1 ? '' : 's'} found
        </span>
        <button className="btn--sm" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      <div className="grid">
        {campaigns.map((campaign, index) => (
          <CampaignCard
            key={campaign.address}
            campaign={campaign}
            accent={ACCENTS[index % ACCENTS.length]}
            isMine={myAddress !== null && campaign.data.admin === myAddress}
            onDonated={() => void load()}
          />
        ))}
      </div>
    </>
  );
}
