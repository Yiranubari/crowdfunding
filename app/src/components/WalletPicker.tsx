import { useClient } from '@solana/react';
import { useConnect, useWallets } from '@solana/kit-plugin-wallet/react';
import type { AppClient } from '../client/client';
import { userFacingError } from '../client/errors';

export function WalletPickerBody() {
  const client = useClient<AppClient>();
  const wallets = useWallets(client);
  const { dispatchAsync: connect, isRunning: connecting, error: connectError } = useConnect(client);

  if (wallets.length === 0) {
    return (
      <p className="muted" style={{ margin: '16px 0 0' }}>
        No wallet detected. Install Phantom, Solflare, or Backpack, then reload the page.
      </p>
    );
  }

  return (
    <>
      <div className="wallet-list">
        {wallets.map((wallet, index) => (
          <button
            key={wallet.name}
            className="wallet-row"
            type="button"
            autoFocus={index === 0}
            disabled={connecting}
            onClick={() => {
              void connect(wallet);
            }}
          >
            <span>{wallet.name}</span>
            <span className="wallet-row__arrow" aria-hidden="true">
              {connecting ? '…' : '→'}
            </span>
          </button>
        ))}
      </div>
      {connecting && <p className="status">Waiting for approval in your wallet…</p>}
      {connectError && !connecting ? (
        <p className="status status--err">{userFacingError(connectError)}</p>
      ) : null}
    </>
  );
}
