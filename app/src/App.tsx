import { useCallback, useState } from 'react';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import type { AppClient } from './client/client';
import { toAddress } from './client/campaigns';
import { WalletBar } from './components/WalletBar';
import { CampaignManager } from './components/CampaignManager';
import { CampaignList } from './components/CampaignList';

export default function App() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const signer = connected?.signer ?? null;

  return (
    <>
      <WalletBar />
      <main className="wrap">
        <h2 className="hero">
          Fund it
          <br />
          on chain.
        </h2>
        <div className="hero__rule" />

        {!connected ? (
          <div className="panel panel--acid">
            <span className="label">Step 1 of 4</span>
            <p style={{ margin: 0 }}>
              Connect a wallet up top to create a campaign. You can still browse what's already
              raising funds below.
            </p>
          </div>
        ) : !signer ? (
          <div className="panel">
            <span className="label">Wallet can't sign</span>
            <p style={{ margin: 0 }}>
              This wallet is read-only. Connect one that can sign transactions.
            </p>
          </div>
        ) : (
          <section className="section">
            <span className="label">Step 2 of 4 — your campaign</span>
            <CampaignManager signer={signer} refreshKey={refreshKey} onChanged={refresh} />
          </section>
        )}

        <section className="section">
          <span className="label">
            {connected ? 'Step 3 of 4 — all campaigns' : 'All campaigns'}
          </span>
          <CampaignList
            refreshKey={refreshKey}
            myAddress={connected ? toAddress(connected.account.address) : null}
          />
        </section>
      </main>
    </>
  );
}
