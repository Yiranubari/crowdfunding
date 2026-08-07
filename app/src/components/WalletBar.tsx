import { useEffect, useState } from 'react';
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

function WalletControls() {
  const client = useClient<AppClient>();
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const { dispatch: connect, isRunning: connecting } = useConnect(client);
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

  if (wallets.length === 0) {
    return (
      <span className="chip">
        <span className="chip__dot" />
        No wallet detected — install Phantom, Solflare, or Backpack
      </span>
    );
  }

  return (
    <div className="stack">
      {wallets.map((wallet) => (
        <button
          key={wallet.name}
          className="btn--go"
          disabled={connecting}
          onClick={() => connect(wallet)}
        >
          {connecting ? 'Connecting…' : `Connect ${wallet.name}`}
        </button>
      ))}
    </div>
  );
}

export function WalletBar() {
  const client = useClient<AppClient>();
  return (
    <header className="bar">
      <h1 className="bar__brand">
        Fundchain
        <span className="bar__tag">Devnet</span>
      </h1>
      <WalletReadyGate client={client} fallback={<span className="chip">Looking for wallets…</span>}>
        <WalletControls />
      </WalletReadyGate>
    </header>
  );
}
