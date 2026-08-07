import { createClient } from '@solana/kit';
import { solanaRpc } from '@solana/kit-plugin-rpc';
import { walletSigner } from '@solana/kit-plugin-wallet';
import { crowdfundingProgram } from './generated';

const rpcUrl = import.meta.env.VITE_RPC_URL ?? 'https://api.devnet.solana.com';

// One client for the whole app. The connected wallet fills the payer + identity
// roles, so every transaction is signed in the user's own wallet.
export const client = createClient()
  .use(walletSigner({ chain: 'solana:devnet' }))
  .use(solanaRpc({ rpcUrl }))
  .use(crowdfundingProgram());

export type AppClient = typeof client;
