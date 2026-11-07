import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppData } from './AppDataContext';
import { createStudyStore, emptyStudyState, type StudyState } from './learning';

type Learning = { state: StudyState; ready: boolean; error: boolean; change: (update: (s: StudyState) => StudyState) => Promise<boolean>; retry: () => void };
const Ctx = createContext<Learning | null>(null);
export const useLearning = () => useContext(Ctx);
export function LearningProvider({ storageKey, children }: { storageKey?: string; children: ReactNode }) {
  const data = useAppData();
  return storageKey && data.LEARNING_PATH ? <EnabledLearning key={storageKey} storageKey={storageKey}>{children}</EnabledLearning> : <>{children}</>;
}
function EnabledLearning({ storageKey, children }: { storageKey: string; children: ReactNode }) {
  const [state, setState] = useState(emptyStudyState), [ready, setReady] = useState(false), [error, setError] = useState(false);
  const store = useMemo(() => createStudyStore(AsyncStorage, storageKey, setState), [storageKey]);
  const load = () => { setError(false); void store.load().then(() => setReady(true)).catch(() => setError(true)); };
  useEffect(load, [store]);
  const change: Learning['change'] = useCallback(async update => {
    try { await store.change(update); setError(false); return true; } catch { setError(true); return false; }
  }, [store]);
  return <Ctx.Provider value={{ state, ready, error, change, retry: load }}>{children}</Ctx.Provider>;
}
