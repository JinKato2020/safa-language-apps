// Optional app-owned tools. Settings keeps them hidden until an explicit version-tap unlock.
import { createContext, useContext, type ReactNode } from 'react';

export type SettingsDevelopmentTools = {
  showReview: () => Promise<'requested' | 'unavailable' | 'failed'>;
  showRequest: () => void;
};
const Context = createContext<SettingsDevelopmentTools | null>(null);
export function SettingsDevelopmentProvider({ value, children }: { value: SettingsDevelopmentTools | null; children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useSettingsDevelopment() { return useContext(Context); }
