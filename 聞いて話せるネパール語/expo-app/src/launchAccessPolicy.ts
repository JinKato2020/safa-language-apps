// Campaign access never depends on ratings, feedback, or a device-clock expiry.
export const LAUNCH_CAMPAIGN = {
  id: 'appa-free-launch-2026',
  enrollmentOpen: true,
  // When ending enrollment, set this to the actual App Store rollout cutoff.
  // Existing local grants and qualifying original App Store downloads stay free.
  closedAt: null as string | null,
};

export type LaunchGrant = { campaign: string; grantedAt: string };
export function parseLaunchGrant(raw: string | null): LaunchGrant | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    return value?.campaign === LAUNCH_CAMPAIGN.id && Number.isFinite(Date.parse(value.grantedAt)) ? value : null;
  } catch { return null; }
}

export function eligibleOriginalDownload(originalDate: string | null | undefined, cutoff: string | null): boolean {
  if (!cutoff || !originalDate) return false;
  const date = Date.parse(originalDate), end = Date.parse(cutoff);
  // Sandbox receipts commonly have a synthetic2013 date, not acquisition proof.
  return Number.isFinite(date) && Number.isFinite(end) && date >= Date.UTC(2020, 0, 1) && date <= end;
}
