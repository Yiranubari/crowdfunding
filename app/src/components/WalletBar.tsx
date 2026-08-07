import { useCallback, useEffect, useRef, useState } from 'react';
import { useClient } from '@solana/react';
import {
  WalletReadyGate,
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
} from '@solana/kit-plugin-wallet/react';
import type { AppClient } from '../client/client';
import { lamportsToSol } from '../client/campaigns';

function truncate(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function Balance({ address }: { address: string }) {
  const client = useClient<AppClient>();
  const [sol, setSol] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    client.rpc
      .getBalance(address as Parameters<typeof client.rpc.getBalance>[0])
      .send()
      .then(({ value }) => {
        if (!cancelled) setSol(lamportsToSol(value));
      })
      .catch(() => {
        if (!cancelled) setSol(null);
      });
    return () => {
      cancelled = true;
    };
  }, [client, address]);

  if (sol === null) return null;
  return <span className="mono">{sol.toFixed(3)} SOL</span>;
}

/** One "Connect wallet" button. Clicking it opens the wallet picker. */
function ConnectButton() {
  const client = useClient<AppClient>();
  const wallets = useWallets(client);
  const { dispatchAsync: connect, isRunning: connecting, error: connectError } = useConnect(client);
  const [open, setOpen] = useState(false);
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

  return (
    <>
      <button
        ref={triggerRef}
        className="btn--go"
        type="button"
        onClick={() => setOpen(true)}
      >
        Connect wallet <span className="caret mono">▾</span>
      </button>

      {open && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label="Choose a wallet"
          onClick={close}
        >
          <div className="modal__panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal__head">
              <span className="label">Choose a wallet</span>
              <button className="modal__close" type="button" aria-label="Close" onClick={close}>
                ×
              </button>
            </div>

            {wallets.length === 0 ? (
              <p className="muted" style={{ margin: '16px 0 0' }}>
                No wallet detected. Install Phantom, Solflare, or Backpack, then reload the page.
              </p>
            ) : (
              <div className="wallet-list">
                {wallets.map((wallet, index) => (
                  <button
                    key={wallet.name}
                    className="wallet-row"
                    type="button"
                    autoFocus={index === 0}
                    disabled={connecting}
                    onClick={() => {
                      void connect(wallet).then(close, () => {
                        // Keep the modal open so the error below is visible.
                      });
                    }}
                  >
                    <span>{wallet.name}</span>
                    <span className="wallet-row__arrow" aria-hidden="true">
                      {connecting ? '…' : '→'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {connecting && <p className="status">Waiting for approval in your wallet…</p>}
            {connectError && !connecting ? (
              <p className="status status--err">
                {connectError instanceof Error ? connectError.message : String(connectError)}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

function WalletControls() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const { dispatch: disconnect, isRunning: disconnecting } = useDisconnect(client);

  if (connected) {
    return (
      <div className="stack">
        <span className="chip">
          <span className="chip__dot chip__dot--live" />
          <span className="mono">{truncate(connected.account.address)}</span>
          <Balance address={connected.account.address} />
        </span>
        <button className="btn--stop" disabled={disconnecting} onClick={() => disconnect()}>
          {disconnecting ? 'Disconnecting…' : 'Disconnect'}
        </button>
      </div>
    );
  }

  return <ConnectButton />;
}

export function WalletBar() {
  const client = useClient<AppClient>();
  return (
    <header className="bar">
      <h1 className="bar__brand">Fundchain</h1>
      <WalletReadyGate client={client} fallback={<span className="chip">Looking for wallets…</span>}>
        <WalletControls />
      </WalletReadyGate>
    </header>
  );
}
