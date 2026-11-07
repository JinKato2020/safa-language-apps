// Check after launch or a later foreground return. Do not poll during a study
// session. A failed check alone schedules an automatic retry.
export function scheduleContentUpdates(check: () => Promise<void>, isActive: () => boolean) {
  let stopped = false, busy = false, nextAttempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = async () => {
    timer = undefined;
    if (stopped || busy || !isActive() || Date.now() < nextAttempt) return;
    busy = true;
    try {
      await check(); nextAttempt = Date.now() + 30 * 60_000;
    } catch {
      nextAttempt = Date.now() + 60_000;
      if (!stopped) timer = setTimeout(() => void run(), 60_000);
    } finally { busy = false; }
  };
  timer = setTimeout(() => void run(), 1500);
  return {
    foreground() {
      if (stopped || busy || Date.now() < nextAttempt) return;
      if (timer) clearTimeout(timer);
      // Foreground transitions have animation work of their own.
      timer = setTimeout(() => void run(), 1500);
    },
    stop() { stopped = true; if (timer) clearTimeout(timer); },
  };
}
