import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import {
  DEFAULT_SETTINGS,
  type AppLanguage,
  type AppTheme,
  resetSettings,
  useSettingsStore,
} from '@/lib/settingsStore';
import i18n from '@/lib/i18n';
import {
  AlertTriangle,
  Check,
  Cloud,
  Database,
  RefreshCw,
  Settings,
  ShieldAlert,
  Smartphone,
  Wrench,
} from 'lucide-react';
import localforage from 'localforage';
import { useCallback, useEffect, useState } from 'react';
import {
  disconnectGoogleAccount,
  getTokens,
  initializeGoogleAuth,
} from '../googleDrive';
import { useTranslate } from '@/lib/useTranslate';

type StorageEstimate = {
  usage?: number;
  quota?: number;
};

function formatBytes(bytes?: number): string {
  if (bytes === undefined || !Number.isFinite(bytes)) return 'Unavailable';
  if (bytes < 1024) return `${bytes} bytes`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Cloud;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

const fieldClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export default function SettingsPage() {
  const { t } = useTranslate();
  const [settings, updateSettings] = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate>();
  const [storageError, setStorageError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const refreshStorageEstimate = useCallback(async () => {
    if (!navigator.storage?.estimate) {
      setStorageError(t('settings.storageNotSupported'));
      return;
    }

    try {
      setStorageEstimate(await navigator.storage.estimate());
      setStorageError('');
    } catch (error) {
      console.error('Failed to estimate local storage usage:', error);
      setStorageError(t('settings.couldNotReadStorage'));
    }
  }, []);

  useEffect(() => {
    let active = true;
    void localforage
      .getItem<GoogleTokens>('google_tokens')
      .then((tokens) => {
        if (active) {
          setIsConnected(Boolean(tokens && tokens.expires_at > Date.now()));
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to read Google account status:', error);
        if (active) setConnectionError(t('settings.couldNotReadAccountStatus'));
      });
    void refreshStorageEstimate();
    return () => {
      active = false;
    };
  }, [refreshStorageEstimate]);

  useEffect(() => {
    if (theme !== settings.theme) {
      updateSettings({ theme });
    }
  }, [settings.theme, theme, updateSettings]);

  useEffect(() => {
    if (i18n.language !== settings.language) {
      void i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n.language]);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setConnectionError('');
    try {
      await initializeGoogleAuth();
      const tokens = await getTokens();
      if (!tokens) {
        throw new Error(t('settings.googleAuthCancelled'));
      }
      setIsConnected(true);
      setActionMessage(t('settings.googleDriveConnected'));
    } catch (error) {
      console.error('Google Drive authentication failed:', error);
      setConnectionError(
        error instanceof Error ? error.message : t('settings.googleAuthFailed'),
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRefreshToken = () => {
    console.log('Refresh Google token requested.');
    setActionMessage(t('settings.tokenRefreshNotImplemented'));
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogleAccount();
      setIsConnected(false);
      setActionMessage(t('settings.googleDriveDisconnected'));
    } catch (error) {
      console.error('Failed to disconnect Google Drive account:', error);
      setConnectionError('Could not remove the saved Google account token.');
    }
  };

  const handleClearCache = () => {
    console.log('Clear cover cache requested.');
    setActionMessage(
      t('settings.coverCacheNotImplemented'),
    );
  };

  const forceResync = () => {
    console.log('Force full Drive resync requested.');
    setActionMessage(t('settings.fullDriveResyncNotImplemented'));
  };

  const handleServiceWorkerUpdate = async () => {
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (!registration) {
        setActionMessage(t('settings.noServiceWorker'));
        return;
      }
      await registration.update();
      window.location.reload();
    } catch (error) {
      console.error('Failed to check for service worker updates:', error);
      setActionMessage(t('settings.updateFailed'));
    }
  };

  const handleClearAllData = async () => {
    const confirmed = window.confirm(t('settings.clearAllDataConfirm'));
    if (!confirmed) return;

    try {
      await localforage.dropInstance({ name: 'epubBookshelf' });
      await localforage.removeItem('libraryFolders');
      await localforage.removeItem('recentFolders');
      resetSettings();
      setTheme(DEFAULT_SETTINGS.theme);
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear local app data:', error);
      setActionMessage(t('settings.couldNotClearAllData'));
    }
  };

  const handleThemeChange = (nextTheme: AppTheme) => {
    updateSettings({ theme: nextTheme });
    setTheme(nextTheme);
  };

  const handleLanguageChange = (nextLanguage: AppLanguage) => {
    updateSettings({ language: nextLanguage });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-8">
      <header className="mb-7">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings aria-hidden="true" className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">{t('common.settings')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('settings.managePreferences')}
        </p>
      </header>

      <Section
        icon={Cloud}
        title={t('settings.googleDrive')}
        description={t('settings.googleDriveDescription')}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-muted-foreground/50'
              }`}
            />
            <span className="font-medium">
              {isConnected ? t('settings.connected') : t('settings.disconnected')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => void handleAuthenticate()}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? t('settings.connecting') : t('settings.connect')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshToken}
              disabled={!isConnected}
            >
              <RefreshCw aria-hidden="true" />
              {t('settings.refreshToken')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleDisconnect()}
              disabled={!isConnected}
            >
              Disconnect
            </Button>
          </div>
        </div>
        {connectionError && (
          <p role="alert" className="text-sm text-destructive">
            {connectionError}
          </p>
        )}
        <Button variant="outline" onClick={forceResync}>
          <RefreshCw aria-hidden="true" />
          {t('settings.forceFullResync')}
        </Button>
      </Section>

      <Section
        icon={Database}
        title={t('settings.localStorage')}
        description={t('settings.localStorageDescription')}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">
              {t('settings.estimatedStorageUsed')}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatBytes(storageEstimate?.usage)}
              {storageEstimate?.quota
                ? ` of ${formatBytes(storageEstimate.quota)} available`
                : ''}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void refreshStorageEstimate()}
          >
            Refresh estimate
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('settings.storageUsageNote')}
        </p>
        {storageError && (
          <p role="status" className="text-sm text-muted-foreground">
            {storageError}
          </p>
        )}
        <Button variant="outline" onClick={handleClearCache}>
          <Database aria-hidden="true" />
          Clear Cover Cache
        </Button>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="mb-3 flex items-start gap-2">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 text-destructive"
            />
            <div>
              <p className="text-sm font-medium">{t('settings.dangerZone')}</p>
              <p className="text-sm text-muted-foreground">
                {t('settings.dangerZoneDescription')}
              </p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => void handleClearAllData()}>
            <ShieldAlert aria-hidden="true" />
            {t('settings.clearAllData')}
          </Button>
        </div>
      </Section>

      <Section
        icon={Smartphone}
        title={t('settings.libraryDisplayPreferences')}
        description={t('settings.libraryDisplayPreferencesDescription')}
      >
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('settings.gridDensity')}</legend>
          <div className="flex gap-2">
            {(['compact', 'spacious'] as const).map((density) => (
              <Button
                key={density}
                type="button"
                size="sm"
                variant={
                  settings.gridDensity === density ? 'default' : 'outline'
                }
                aria-pressed={settings.gridDensity === density}
                onClick={() => updateSettings({ gridDensity: density })}
              >
                {density === 'compact' ? t('settings.compact') : t('settings.spacious')}
              </Button>
            ))}
          </div>
        </fieldset>
        <label className="block space-y-2 text-sm font-medium">
          {t('settings.theme')}
          <select
            className={fieldClassName}
            value={theme}
            onChange={(event) =>
              handleThemeChange(event.target.value as AppTheme)
            }
          >
            <option value="system">{t('settings.systemDefault')}</option>
            <option value="light">{t('common.light')}</option>
            <option value="dark">{t('common.dark')}</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm font-medium">
          {t('settings.defaultSortOrder')}
          <select
            className={fieldClassName}
            value={settings.defaultSortOrder}
            onChange={(event) =>
              updateSettings({
                defaultSortOrder: event.target.value as
                  | 'dateAdded'
                  | 'alphabetical'
                  | 'lastRead',
              })
            }
          >
            <option value="dateAdded">{t('settings.dateAdded')}</option>
            <option value="alphabetical">{t('settings.alphabetical')}</option>
            <option value="lastRead">{t('settings.lastRead')}</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm font-medium">
          {t('settings.language')}
          <select
            className={fieldClassName}
            value={settings.language}
            onChange={(event) =>
              handleLanguageChange(event.target.value as AppLanguage)
            }
          >
            <option value="en">{t('settings.languageEnglish')}</option>
            <option value="th">{t('settings.languageThai')}</option>
          </select>
        </label>
      </Section>

      <Section
        icon={Check}
        title={t('settings.exportDownload')}
        description={t('settings.exportDownloadDescription')}
      >
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            {t('settings.defaultDownloadFormat')}
          </legend>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={
                settings.defaultDownloadFormat === 'epub'
                  ? 'default'
                  : 'outline'
              }
              aria-pressed={settings.defaultDownloadFormat === 'epub'}
              onClick={() => updateSettings({ defaultDownloadFormat: 'epub' })}
            >
              {t('settings.standardEpub')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={
                settings.defaultDownloadFormat === 'kepub'
                  ? 'default'
                  : 'outline'
              }
              aria-pressed={settings.defaultDownloadFormat === 'kepub'}
              onClick={() => updateSettings({ defaultDownloadFormat: 'kepub' })}
            >
              {t('settings.kepub')}
            </Button>
          </div>
        </fieldset>
        <Toggle
          label={t('settings.allowCellularDownloads')}
          description={t('settings.allowCellularDownloadsDescription')}
          checked={settings.allowCellularDownloads}
          onChange={(allowCellularDownloads) =>
            updateSettings({ allowCellularDownloads })
          }
        />
      </Section>

      <Section
        icon={Wrench}
        title={t('settings.advancedDeveloper')}
        description={t('settings.advancedDeveloperDescription')}
      >
        <Button
          variant="outline"
          className="whitespace-normal"
          onClick={() => void handleServiceWorkerUpdate()}
        >
          <RefreshCw aria-hidden="true" />
          {t('settings.serviceWorkerUpdate')}
        </Button>
        <Toggle
          label={t('settings.diagnosticNetworkLogs')}
          description={t('settings.diagnosticNetworkLogsDescription')}
          checked={settings.diagnosticNetworkLogs}
          onChange={(diagnosticNetworkLogs) =>
            updateSettings({ diagnosticNetworkLogs })
          }
        />
      </Section>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        {t('settings.version', { version: __APP_VERSION__ })}
      </p>

      {actionMessage && (
        <p role="status" className="text-sm text-muted-foreground">
          {actionMessage}
        </p>
      )}
    </div>
  );
}
