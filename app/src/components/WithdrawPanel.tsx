import { useEffect, useState, type FormEvent } from 'react';
import { useClient } from '@solana/react';
import type { Account, TransactionSigner } from '@solana/kit';
import type { AppClient } from '../client/client';
import { lamportsToSol, lamportsToSolString, solToLamports } from '../client/campaigns';
import { userFacingError } from '../client/errors';
import type { Campaign } from '../client/generated';

const CAMPAIGN_ACCOUNT_SPACE = 9000n;

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'done'; signature: string }
  | { kind: 'error'; message: string };

export function WithdrawPanel({
  campaign,
  signer,
  onWithdrawn,
}: {
  campaign: Account<Campaign>;
  signer: TransactionSigner;
  onWithdrawn: () => void;
}) {
  const client = useClient<AppClient>();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [rent, setRent] = useState<bigint | null>(null);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [bal, minimumRent] = await Promise.all([
          client.rpc.getBalance(campaign.address).send(),
          client.rpc.getMinimumBalanceForRentExemption(CAMPAIGN_ACCOUNT_SPACE).send(),
        ]);
        if (cancelled) return;
        setBalance(bal.value);
        setRent(minimumRent);
      } catch (cause) {
        if (!cancelled) {
          console.error('load withdraw limits failed:', cause);
          setStatus({ kind: 'error', message: userFacingError(cause) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, campaign.address, reloadKey]);

  const available =
    balance !== null && rent !== null && balance > rent ? balance - rent : 0n;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!signer || status.kind === 'sending') return;
    setStatus({ kind: 'sending' });
    try {
      const result = await client.crowdfunding.instructions
        .withdraw({
          campaign: campaign.address,
          user: signer,
          amount: solToLamports(amount),
        })
        .sendTransaction();
      setStatus({ kind: 'done', signature: result.context.signature });
      setReloadKey((key) => key + 1);
      onWithdrawn();
    } catch (error) {
      console.error('withdraw failed:', error);
      setStatus({ kind: 'error', message: userFacingError(error) });
    }
  }

  return (
    <div className="withdraw">
      <span className="label">Withdraw</span>

      <div className="withdraw__available">
        <span>
          Available to withdraw:{' '}
          <span className="mono">
            {balance !== null && rent !== null ? lamportsToSolString(available) : '…'} SOL
          </span>
        </span>
        <span className="muted">raised {lamportsToSol(campaign.data.amountDonated).toFixed(3)} SOL</span>
      </div>

      {status.kind === 'done' ? (
        <div className="donate__done">
          <p className="status status--ok">
            Withdrawn!{' '}
            <a
              className="txlink mono"
              href={`https://explorer.solana.com/tx/${status.signature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
            >
              View transaction →
            </a>
          </p>
          <div className="form__actions">
            <button
              className="btn--go"
              type="button"
              onClick={() => {
                setAmount('');
                setStatus({ kind: 'idle' });
              }}
            >
              Withdraw again
            </button>
          </div>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="label">Amount in SOL</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              autoFocus
              placeholder="0.5"
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <div className="chip-row">
            {balance !== null && rent !== null && (
              <button
                className="btn--sm"
                type="button"
                onClick={() => setAmount(lamportsToSolString(available))}
              >
                Max
              </button>
            )}
          </div>

          <div className="form__actions">
            <button
              className="btn--go"
              type="submit"
              disabled={status.kind === 'sending' || balance === null || rent === null}
            >
              {status.kind === 'sending' ? 'Sending…' : 'Withdraw'}
            </button>
            {status.kind === 'sending' && <span className="status">Waiting for your wallet…</span>}
          </div>

          {status.kind === 'error' && <p className="status status--err">{status.message}</p>}
        </form>
      )}
    </div>
  );
}
