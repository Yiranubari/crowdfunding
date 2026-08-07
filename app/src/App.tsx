import { WalletBar } from './components/WalletBar';

export default function App() {
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
        <div className="panel panel--acid">
          <span className="label">Step 1 of 4</span>
          <p style={{ margin: 0 }}>
            Wallet connection is live. Create, donate, and withdraw land next.
          </p>
        </div>
      </main>
    </>
  );
}
