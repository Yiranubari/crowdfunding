import { useState, type FormEvent } from 'react';
import { useClient } from '@solana/react';
import type { TransactionSigner } from '@solana/kit';
import type { AppClient } from '../client/client';

const NAME_MAX = 32;
const DESC_MAX = 3000;

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'done'; signature: string }
  | { kind: 'error'; message: string };

function errorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.length > 220 ? `${raw.slice(0, 219)}…` : raw;
}

export function CampaignForm({
  signer,
  onCreated,
}: {
  signer: TransactionSigner;
  onCreated: () => void;
}) {
  const client = useClient<AppClient>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && status.kind !== 'sending';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus({ kind: 'sending' });
    try {
      const tx = client.crowdfunding.instructions.create({
        user: signer,
        name: trimmedName,
        description: description.trim(),
      });
      const result = await tx.sendTransaction();
      setStatus({ kind: 'done', signature: result.context.signature });
      onCreated();
    } catch (error) {
      setStatus({ kind: 'error', message: errorMessage(error) });
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span className="label">Campaign name</span>
        <input
          type="text"
          value={name}
          maxLength={NAME_MAX}
          autoComplete="off"
          placeholder="e.g. Repair the skatepark"
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label className="field">
        <span className="label">Description</span>
        <textarea
          value={description}
          maxLength={DESC_MAX}
          rows={4}
          placeholder="What are you raising funds for? Keep it punchy."
          onChange={(event) => setDescription(event.target.value)}
        />
        <span className="field__counter">
          {description.length}/{DESC_MAX}
        </span>
      </label>

      <div className="form__actions">
        <button className="btn--go" type="submit" disabled={!canSubmit}>
          {status.kind === 'sending' ? 'Creating…' : 'Create campaign'}
        </button>
        {status.kind === 'sending' && <span className="status">Waiting for your wallet…</span>}
      </div>

      {status.kind === 'done' && (
        <p className="status status--ok">
          Campaign created!{' '}
          <a
            className="txlink mono"
            href={`https://explorer.solana.com/tx/${status.signature}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
          >
            View transaction →
          </a>
        </p>
      )}

      {status.kind === 'error' && <p className="status status--err">{status.message}</p>}
    </form>
  );
}
