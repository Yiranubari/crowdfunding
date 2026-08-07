import { unwrapSimulationError } from '@solana/kit';

/** Walks a `cause` chain to the deepest human-readable message. */
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

/**
 * Technical fallback. A send can fail in two noisy ways that bury the real
 * reason in `cause`:
 *  - preflight rejection ("Transaction simulation failed")
 *  - "Transaction failed when it was simulated in order to estimate its
 *    resource limits" (Kit simulates to size the transaction before sending)
 * `unwrapSimulationError` peels those wrappers, then we dig to the deepest
 * message, e.g. "Attempt to debit an account but found no record of a prior
 * credit." or "custom program error: 0x1".
 */
export function errorMessage(error: unknown): string {
  const unwrapped = unwrapSimulationError(error);
  const raw =
    deepestMessage(unwrapped) ??
    (typeof unwrapped === 'string'
      ? unwrapped
      : unwrapped instanceof Error
        ? unwrapped.message
        : String(unwrapped));
  // Drop a dev-mode "[SOLANA_ERROR__CODE]: " prefix if one leaked through.
  const cleaned = raw.replace(/^\[[A-Z_][^\]]*\]\s*:\s*/, '');
  return cleaned.length > 220 ? `${cleaned.slice(0, 219)}…` : cleaned;
}

type FriendlyRule = { test: RegExp; message: string };

/**
 * Known failure classes, most specific first. Messages are plain sentences a
 * user can act on; unknown errors fall through to the technical text so
 * debugging stays possible.
 */
// Instruction error codes are stable runtime codes: 5 = InsufficientFunds,
// 6 = IncorrectProgramId. This program's `withdraw` returns IncorrectProgramId
// for the admin check and InsufficientFunds when the campaign can't cover it.
const FRIENDLY_RULES: FriendlyRule[] = [
  {
    test: /user rejected|declined|denied|request was rejected|request.*cancelled/i,
    message: 'You declined the request in your wallet — nothing was sent.',
  },
  {
    // Wallet-balance failures specifically. Bare "insufficient funds" is left
    // out on purpose: the withdraw balance check decodes to "Insufficient
    // funds for instruction" and has its own, different message below.
    test: /attempt to debit an account|insufficient lamports|insufficient funds for fee/i,
    message:
      "Not enough SOL in your wallet to cover this transaction. Grab some devnet SOL (faucet or `solana airdrop`) and try again.",
  },
  {
    // withdraw admin check (ProgramError::IncorrectProgramId)
    test: /custom program error: 0x0?6\b|incorrect program id/i,
    message: 'Only the campaign creator can do this.',
  },
  {
    // withdraw balance check (ProgramError::InsufficientFunds)
    test: /custom program error: 0x0?5\b/i,
    message: "That amount isn't available in the campaign yet.",
  },
  {
    // Kit's decoded form of instruction error 5 (ambiguous: wallet or campaign)
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

/** Plain-language message for the UI, with a technical fallback. */
export function userFacingError(error: unknown): string {
  const technical = errorMessage(error);
  for (const { test, message } of FRIENDLY_RULES) {
    if (test.test(technical)) return message;
  }
  return technical;
}
