import { address, type Address } from '@solana/kit';

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
