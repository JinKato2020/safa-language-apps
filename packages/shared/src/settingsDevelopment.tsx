// Optional app-owned tools. App Store production and other apps supply no tools.
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
