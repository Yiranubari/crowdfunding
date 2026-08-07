import { useEffect, useState } from 'react';

export function usePolling(intervalMs: number): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setTick((value) => value + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return tick;
}
