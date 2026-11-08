import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import {
  DEFAULT_SETTINGS,
  type AppTheme,
  resetSettings,
  useSettingsStore,
} from '@/lib/settingsStore';
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
      setStorageError('Storage estimates are not supported by this browser.');
      return;
    }

    try {
      setStorageEstimate(await navigator.storage.estimate());
      setStorageError('');
    } catch (error) {
      console.error('Failed to estimate local storage usage:', error);
      setStorageError('Could not read the browser storage estimate.');
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
        if (active) setConnectionError('Could not read the saved account status.');
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

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setConnectionError('');
    try {
      await initializeGoogleAuth();
      const tokens = await getTokens();
      if (!tokens) {
        throw new Error('Google authentication was cancelled or not completed.');
      }
      setIsConnected(true);
      setActionMessage('Google Drive account connected.');
    } catch (error) {
      console.error('Google Drive authentication failed:', error);
      setConnectionError(
        error instanceof Error ? error.message : 'Google authentication failed.',
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRefreshToken = () => {
    console.log('Refresh Google token requested.');
    setActionMessage('Token refresh is not implemented yet.');
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogleAccount();
      setIsConnected(false);
      setActionMessage('Google Drive account disconnected on this device.');
    } catch (error) {
      console.error('Failed to disconnect Google Drive account:', error);
      setConnectionError('Could not remove the saved Google account token.');
    }
  };

  const handleClearCache = () => {
    console.log('Clear cover cache requested.');
    setActionMessage(
      'Cover cache clearing is not implemented yet; cached EPUB metadata and covers are unchanged.',
    );
  };

  const forceResync = () => {
    console.log('Force full Drive resync requested.');
    setActionMessage('Full Drive resync is not implemented yet.');
  };

  const handleServiceWorkerUpdate = async () => {
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (!registration) {
        setActionMessage('No service worker is registered for this app.');
        return;
      }
      await registration.update();
      window.location.reload();
    } catch (error) {
      console.error('Failed to check for service worker updates:', error);
      setActionMessage('Could not check for service worker updates.');
    }
  };

  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      'Clear all locally cached books, library selections, and preferences? Your Google Drive files will not be changed, and your account token will be kept.',
    );
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
      setActionMessage('Could not clear all local data. See the console for details.');
    }
  };

  const handleThemeChange = (nextTheme: AppTheme) => {
    updateSettings({ theme: nextTheme });
    setTheme(nextTheme);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-8">
      <header className="mb-7">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings aria-hidden="true" className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your Drive connection, local cache, and bookshelf preferences.
        </p>
      </header>

      <Section
        icon={Cloud}
        title="Google Drive integration"
        description="Connect the Drive account that contains your EPUB library."
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-muted-foreground/50'
              }`}
            />
            <span className="font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => void handleAuthenticate()}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? 'Connecting…' : 'Authenticate'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshToken}
              disabled={!isConnected}
            >
              <RefreshCw aria-hidden="true" />
              Refresh Token
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
          Force Full Resync
        </Button>
      </Section>

      <Section
        icon={Database}
        title="Local storage & cache"
        description="EPUB files are not stored here; only app data and cached book information are kept locally."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">
              Estimated local storage used
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
          The browser reports origin-wide usage, so this estimate may include
          other site data.
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
              <p className="text-sm font-medium">Danger zone</p>
              <p className="text-sm text-muted-foreground">
                Remove local app data and return to a fresh state. Drive files
                and your saved account token are not affected.
              </p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => void handleClearAllData()}>
            <ShieldAlert aria-hidden="true" />
            Clear All Data
          </Button>
        </div>
      </Section>

      <Section
        icon={Smartphone}
        title="Library display preferences"
        description="Choose how your bookshelf is displayed and sorted."
      >
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Grid density</legend>
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
                {density === 'compact' ? 'Compact' : 'Spacious'}
              </Button>
            ))}
          </div>
        </fieldset>
        <label className="block space-y-2 text-sm font-medium">
          Theme
          <select
            className={fieldClassName}
            value={theme}
            onChange={(event) =>
              handleThemeChange(event.target.value as AppTheme)
            }
          >
            <option value="system">System Default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm font-medium">
          Default Sort Order
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
            <option value="dateAdded">Date Added</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="lastRead">Last Read</option>
          </select>
        </label>
      </Section>

      <Section
        icon={Check}
        title="Export & download"
        description="Set defaults for EPUB downloads on this device."
      >
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Default Download Format
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
              Standard EPUB
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
              KEPUB
            </Button>
          </div>
        </fieldset>
        <Toggle
          label="Allow background downloading over cellular data"
          description="Allow downloads when a metered mobile connection is in use."
          checked={settings.allowCellularDownloads}
          onChange={(allowCellularDownloads) =>
            updateSettings({ allowCellularDownloads })
          }
        />
      </Section>

      <Section
        icon={Wrench}
        title="Advanced / developer"
        description="Tools for app updates and troubleshooting."
      >
        <Button
          variant="outline"
          onClick={() => void handleServiceWorkerUpdate()}
        >
          <RefreshCw aria-hidden="true" />
          Check for Service Worker Updates & Hard Refresh
        </Button>
        <Toggle
          label="Enable Diagnostic Network Logs in UI"
          description="Allow network diagnostics to be surfaced in the interface."
          checked={settings.diagnosticNetworkLogs}
          onChange={(diagnosticNetworkLogs) =>
            updateSettings({ diagnosticNetworkLogs })
          }
        />
      </Section>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Version {__APP_VERSION__}
      </p>

      {actionMessage && (
        <p role="status" className="text-sm text-muted-foreground">
          {actionMessage}
        </p>
      )}
    </div>
  );
}
