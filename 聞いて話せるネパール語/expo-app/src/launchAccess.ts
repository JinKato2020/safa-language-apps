import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { LAUNCH_CAMPAIGN, parseLaunchGrant, type LaunchGrant } from './launchAccessPolicy';

const KEY = 'appa.free-launch.lifetime.v1';
const options = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };

export async function saveLaunchGrant(grant: LaunchGrant): Promise<void> {
  const raw = JSON.stringify(grant);
  // Keychain survives ordinary app updates; AsyncStorage is a second local copy.
  // Receipt-based restoration handles a clean device when enrollment has ended.
  await Promise.allSettled([SecureStore.setItemAsync(KEY, raw, options), AsyncStorage.setItem(KEY, raw)]);
}

export async function loadLaunchAccess(): Promise<boolean> {
  const copies = await Promise.allSettled([SecureStore.getItemAsync(KEY, options), AsyncStorage.getItem(KEY)]);
  const existing = copies.map(r => r.status === 'fulfilled' ? parseLaunchGrant(r.value) : null).find(Boolean);
  if (existing) { await saveLaunchGrant(existing); return true; }
  if (!LAUNCH_CAMPAIGN.enrollmentOpen) return false;
  await saveLaunchGrant({ campaign: LAUNCH_CAMPAIGN.id, grantedAt: new Date().toISOString() });
  return true;
}
