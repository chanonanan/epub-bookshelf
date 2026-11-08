import { useSyncExternalStore } from 'react';

export type AppTheme = 'system' | 'light' | 'dark';
export type GridDensity = 'compact' | 'spacious';
export type DefaultSortOrder = 'dateAdded' | 'alphabetical' | 'lastRead';
export type AppLanguage = 'en' | 'th';

export interface AppSettings {
  gridDensity: GridDensity;
  theme: AppTheme;
  defaultSortOrder: DefaultSortOrder;
  language: AppLanguage;
  defaultDownloadFormat: 'epub' | 'kepub';
  allowCellularDownloads: boolean;
  diagnosticNetworkLogs: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  gridDensity: 'spacious',
  theme: 'dark',
  defaultSortOrder: 'dateAdded',
  language: 'en',
  defaultDownloadFormat: 'epub',
  allowCellularDownloads: false,
  diagnosticNetworkLogs: false,
};

const STORAGE_KEY = 'epub-bookshelf-settings';
const listeners = new Set<() => void>();
let currentSettings: AppSettings | undefined;

function getSettings(): AppSettings {
  if (currentSettings) return currentSettings;

  const storedSettings = window.localStorage.getItem(STORAGE_KEY);
  if (!storedSettings) {
    currentSettings = DEFAULT_SETTINGS;
    return currentSettings;
  }

  const parsed: unknown = JSON.parse(storedSettings);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Saved settings are invalid.');
  }

  const values = parsed as Partial<AppSettings>;
  currentSettings = {
    ...DEFAULT_SETTINGS,
    ...values,
    gridDensity:
      values.gridDensity === 'compact' || values.gridDensity === 'spacious'
        ? values.gridDensity
        : DEFAULT_SETTINGS.gridDensity,
    theme:
      values.theme === 'system' ||
      values.theme === 'light' ||
      values.theme === 'dark'
        ? values.theme
        : DEFAULT_SETTINGS.theme,
    defaultSortOrder:
      values.defaultSortOrder === 'dateAdded' ||
      values.defaultSortOrder === 'alphabetical' ||
      values.defaultSortOrder === 'lastRead'
        ? values.defaultSortOrder
        : DEFAULT_SETTINGS.defaultSortOrder,
    language:
      values.language === 'en' || values.language === 'th'
        ? values.language
        : DEFAULT_SETTINGS.language,
    defaultDownloadFormat:
      values.defaultDownloadFormat === 'kepub' ||
      values.defaultDownloadFormat === 'epub'
        ? values.defaultDownloadFormat
        : DEFAULT_SETTINGS.defaultDownloadFormat,
    allowCellularDownloads:
      typeof values.allowCellularDownloads === 'boolean'
        ? values.allowCellularDownloads
        : DEFAULT_SETTINGS.allowCellularDownloads,
    diagnosticNetworkLogs:
      typeof values.diagnosticNetworkLogs === 'boolean'
        ? values.diagnosticNetworkLogs
        : DEFAULT_SETTINGS.diagnosticNetworkLogs,
  };
  return currentSettings;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateSettings(updates: Partial<AppSettings>): void {
  const nextSettings = { ...getSettings(), ...updates };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
  currentSettings = nextSettings;
  listeners.forEach((listener) => listener());
}

export function resetSettings(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  currentSettings = DEFAULT_SETTINGS;
  listeners.forEach((listener) => listener());
}

export function useSettingsStore(): [
  AppSettings,
  (updates: Partial<AppSettings>) => void,
] {
  const settings = useSyncExternalStore(subscribe, getSettings, () =>
    DEFAULT_SETTINGS,
  );
  return [settings, updateSettings];
}
