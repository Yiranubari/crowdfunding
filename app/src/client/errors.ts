import { unwrapSimulationError } from '@solana/kit';

function deepestMessage(error: unknown, seen = new Set<unknown>()): string | null {
  if (error === null || typeof error !== 'object' || seen.has(error)) return null;
  seen.add(error);
  const cause = (error as { cause?: unknown }).cause;
  if (typeof cause === 'string') return cause;
  const deeper = cause !== undefined ? deepestMessage(cause, seen) : null;
  if (deeper !== null) return deeper;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && message.length > 0 ? message : null;
}

export function errorMessage(error: unknown): string {
  const unwrapped = unwrapSimulationError(error);
  const raw =
    deepestMessage(unwrapped) ??
    (typeof unwrapped === 'string'
      ? unwrapped
      : unwrapped instanceof Error
        ? unwrapped.message
        : String(unwrapped));
  const cleaned = raw.replace(/^\[[A-Z_][^\]]*\]\s*:\s*/, '');
  return cleaned.length > 220 ? `${cleaned.slice(0, 219)}…` : cleaned;
}

type FriendlyRule = { test: RegExp; message: string };

const FRIENDLY_RULES: FriendlyRule[] = [
  {
    test: /user rejected|declined|denied|request was rejected|request.*cancelled/i,
    message: 'You declined the request in your wallet — nothing was sent.',
  },
  {
    test: /attempt to debit an account|insufficient lamports|insufficient funds for fee/i,
    message:
      "Not enough SOL in your wallet to cover this transaction. Grab some devnet SOL (faucet or `solana airdrop`) and try again.",
  },
  {
    test: /custom program error: 0x0?6\b|incorrect program id/i,
    message: 'Only the campaign creator can do this.',
  },
  {
    test: /custom program error: 0x0?5\b/i,
    message: "That amount isn't available in the campaign yet.",
  },
  {
    test: /insufficient funds for instruction/i,
    message: "Not enough funds are available for that amount.",
  },
  {
    test: /account already in use|already initialized/i,
    message: "You already have a campaign — it's one per wallet.",
  },
  {
    test: /account not found|program account not found/i,
    message: "Couldn't find that campaign on-chain. It may have been removed.",
  },
  {
    test: /custom program error/i,
    message: 'The program rejected this transaction.',
  },
  {
    test:
      /failed to fetch|fetch failed|network error|timed out|timeout|connection refused|too many requests|socket hang up/i,
    message: "Couldn't reach the network. Check your connection and try again.",
  },
  {
    test: /fee payer/i,
    message: 'Your wallet is not set up to pay for this. Try disconnecting and reconnecting it.',
  },
];

export function userFacingError(error: unknown): string {
  const technical = errorMessage(error);
  for (const { test, message } of FRIENDLY_RULES) {
    if (test.test(technical)) return message;
  }
  return technical;
}
