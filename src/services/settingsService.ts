import { db } from '@/db/schema';
import type { Settings } from '@/types/models';

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('global');
  return (
    s ?? {
      id: 'global',
      viewMode: 'card',
      theme: 'light',
      defaultGroupBy: 'none',
    }
  );
}

export async function updateSettings(patch: Partial<Settings>) {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch });
}
