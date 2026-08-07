import type { Account } from '@solana/kit';
import type { Campaign } from '../client/generated';
import { formatAddress, lamportsToSol } from '../client/campaigns';

export type Accent = 'acid' | 'tomato' | 'violet';

export function CampaignCard({
  campaign,
  accent,
  isMine,
}: {
  campaign: Account<Campaign>;
  accent: Accent;
  isMine: boolean;
}) {
  const { name, description, admin, amountDonated } = campaign.data;

  return (
    <article className={`card card--${accent}`}>
      {isMine && <span className="card__flag">Yours</span>}
      <h3 className="card__name">{name}</h3>
      <p className="card__desc">{description}</p>
      <div className="card__foot">
        <span className="card__raised mono">
          {lamportsToSol(amountDonated).toFixed(3)} <span className="muted">SOL</span>
        </span>
        <span className="mono muted">{formatAddress(admin)}</span>
      </div>
    </article>
  );
}
