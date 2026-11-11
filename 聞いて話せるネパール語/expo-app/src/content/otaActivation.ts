// Apply a complete text/audio snapshot in this launch, without replacing a
// sentence being studied or stopping listening audio. AppShell reports
// "Listening" while background playback is active, even on another tab.
const LANDING_ROUTES = new Set(['HomeTab', 'Theme', 'GrammarLibrary', 'VocabCategory', 'SettingsTab', 'SettingsMain']);

export function createContentActivation<T extends { version: number }>(
  current: T, initialRoute: string | undefined,
  apply: (snapshot: T) => void, pending: () => void,
) {
  let route = initialRoute, staged: T | undefined, stopped = false;
  function flush() {
    if (stopped || !staged || !LANDING_ROUTES.has(route ?? '')) return;
    current = staged; staged = undefined; apply(current);
  }
  return {
    receive(next: T) {
      if (stopped || next.version < Math.max(current.version, staged?.version ?? 0)) return;
      if (next.version === current.version) {
        // Attach the baseline's prepared audio without changing lesson text.
        if (next === current) return;
        current = next; apply(next);
        return;
      }
      staged = next; pending(); flush();
    },
    routeChanged(name: string | undefined) { route = name; flush(); },
    stop() { stopped = true; staged = undefined; },
  };
}
