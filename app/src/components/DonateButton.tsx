import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import type { Account } from '@solana/kit';
import type { AppClient } from '../client/client';
import { solToLamports } from '../client/campaigns';
import { userFacingError } from '../client/errors';
import type { Campaign } from '../client/generated';
import { WalletPickerBody } from './WalletPicker';

const QUICK_AMOUNTS = [0.1, 0.5, 1];

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'done'; signature: string }
  | { kind: 'error'; message: string };

export function DonateButton({
  campaign,
  onDonated,
}: {
  campaign: Account<Campaign>;
  onDonated: () => void;
}) {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const signer = connected?.signer ?? null;
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const reset = () => {
    setAmount('');
    setStatus({ kind: 'idle' });
  };

  const openModal = () => {
    reset();
    setOpen(true);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!signer || status.kind === 'sending') return;
    setStatus({ kind: 'sending' });
    try {
      const result = await client.crowdfunding.instructions
        .donate({
          campaign: campaign.address,
          user: signer,
          amount: solToLamports(amount),
        })
        .sendTransaction();
      setStatus({ kind: 'done', signature: result.context.signature });
      onDonated();
    } catch (error) {
      console.error('donate failed:', error);
      setStatus({ kind: 'error', message: userFacingError(error) });
    }
  }

  return (
    <>
      <button ref={triggerRef} className="btn--go donate-trigger" type="button" onClick={openModal}>
        Donate
      </button>

      {open && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Donate to ${campaign.data.name}`}
          onClick={close}
        >
          <div className="modal__panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal__head">
              <span className="label">Donate — {campaign.data.name}</span>
              <button className="modal__close" type="button" aria-label="Close" onClick={close}>
                ×
              </button>
            </div>

            {!signer ? (
              <>
                <p className="muted" style={{ margin: '16px 0 0' }}>
                  Connect a wallet to donate:
                </p>
                <WalletPickerBody />
              </>
            ) : status.kind === 'done' ? (
              <div className="donate__done">
                <p className="status status--ok">
                  Donation sent!{' '}
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
                  <button className="btn--go" type="button" onClick={reset}>
                    Donate again
                  </button>
                  <button type="button" onClick={close}>
                    Close
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
                  {QUICK_AMOUNTS.map((value) => (
                    <button
                      key={value}
                      className="btn--sm"
                      type="button"
                      onClick={() => setAmount(String(value))}
                    >
                      {value} SOL
                    </button>
                  ))}
                </div>

                <div className="form__actions">
                  <button className="btn--go" type="submit" disabled={status.kind === 'sending'}>
                    {status.kind === 'sending' ? 'Sending…' : 'Send donation'}
                  </button>
                  {status.kind === 'sending' && (
                    <span className="status">Waiting for your wallet…</span>
                  )}
                </div>

                {status.kind === 'error' && <p className="status status--err">{status.message}</p>}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
