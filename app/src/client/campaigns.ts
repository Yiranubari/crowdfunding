import {
  address,
  getBase58Decoder,
  parseBase58RpcAccount,
  type Account,
  type Address,
  type Base58EncodedBytes,
} from '@solana/kit';
import type { AppClient } from './client';
import {
  CAMPAIGN_DISCRIMINATOR,
  CROWDFUNDING_PROGRAM_ADDRESS,
  decodeCampaign,
  type Campaign,
} from './generated';

export const LAMPORTS_PER_SOL = 1_000_000_000;

export function lamportsToSol(value: bigint | number): number {
  return Number(value) / LAMPORTS_PER_SOL;
}

export function solToLamports(value: string | number): bigint {
  const sol = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(sol) || sol <= 0) {
    throw new Error('Enter an amount greater than 0');
  }
  return BigInt(Math.round(sol * LAMPORTS_PER_SOL));
}

export function toAddress(value: string): Address {
  return address(value);
}

export function formatAddress(value: string, head = 4, tail = 4): string {
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}



/**
 * Lists every Campaign account owned by the program, filtered on the account
 * discriminator so unrelated accounts (if any) never reach the decoder.
 */
export async function listCampaigns(
  client: AppClient,
): Promise<Array<Account<Campaign>>> {
  const accounts = await client.rpc
    .getProgramAccounts(CROWDFUNDING_PROGRAM_ADDRESS, {
      encoding: 'base58',
      filters: [
        {
          memcmp: {
            offset: 0n,
            encoding: 'base58',
            bytes: getBase58Decoder().decode(
              CAMPAIGN_DISCRIMINATOR,
            ) as Base58EncodedBytes,
          },
        },
      ],
    })
    .send();
  return accounts.map(({ pubkey, account }) =>
    decodeCampaign(parseBase58RpcAccount(pubkey, account)),
  );
}
