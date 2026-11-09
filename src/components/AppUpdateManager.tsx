import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { AppUpdateContext, type UpdateStatus } from '@/lib/appUpdateContext';
import { useTranslate } from '@/lib/useTranslate';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface BuildInfo {
  version: string;
  builtAt: string;
}

const SKIPPED_BUILD_KEY = 'epub-bookshelf-skipped-build';

function isBuildInfo(value: unknown): value is BuildInfo {
  if (typeof value !== 'object' || value === null) return false;
  const info = value as Record<string, unknown>;
  return (
    typeof info.version === 'string' &&
    typeof info.builtAt === 'string' &&
    Number.isFinite(Date.parse(info.builtAt))
  );
}

function readSkippedBuild(): string | null {
  try {
    return window.localStorage.getItem(SKIPPED_BUILD_KEY);
  } catch (error) {
    console.error('Could not read the skipped app update:', error);
    return null;
  }
}

export function AppUpdateManager({ children }: { children: ReactNode }) {
  const { t } = useTranslate();
  const [refreshEvent, setRefreshEvent] = useState(0);
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);
  const [buildInfoFailed, setBuildInfoFailed] = useState(false);
  const [dismissedUpdate, setDismissedUpdate] = useState(false);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [isInstalling, setIsInstalling] = useState(false);
  const [skippedBuild, setSkippedBuild] = useState(readSkippedBuild);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onNeedRefresh: () => {
      setNeedRefresh(true);
      setRefreshEvent((current) => current + 1);
      setBuildInfo(null);
      setBuildInfoFailed(false);
      setDismissedUpdate(false);
      setStatus('idle');
    },
    onRegisterError: (error) => {
      console.error('Failed to register the app service worker:', error);
      setStatus('failed');
    },
    onRegisteredSW: (_scriptUrl, serviceWorkerRegistration) => {
      if (serviceWorkerRegistration) {
        setRegistration(serviceWorkerRegistration);
      }
    },
  });

  useEffect(() => {
    if (!registration) return;

    const checkForUpdate = () => {
      if (!navigator.onLine || document.visibilityState !== 'visible') return;
      void registration.update().catch((error: unknown) => {
        console.error('Failed to check for app updates:', error);
      });
    };
    const interval = window.setInterval(checkForUpdate, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', checkForUpdate);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', checkForUpdate);
    };
  }, [registration]);

  useEffect(() => {
    if (!needRefresh) return;

    let active = true;
    const loadBuildInfo = async () => {
      try {
        const url = new URL(
          `${import.meta.env.BASE_URL}build-info.json`,
          window.location.origin,
        );
        url.searchParams.set('check', String(Date.now()));
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Build info request failed with ${response.status}.`);
        }
        const value: unknown = await response.json();
        if (!isBuildInfo(value)) {
          throw new Error('Build info response has an invalid format.');
        }
        if (active) {
          setBuildInfo(value);
          setBuildInfoFailed(false);
        }
      } catch (error) {
        console.error('Failed to load the available app version:', error);
        if (active) {
          setBuildInfo(null);
          setBuildInfoFailed(true);
        }
      }
    };

    void loadBuildInfo();
    return () => {
      active = false;
    };
  }, [needRefresh, refreshEvent]);

  useEffect(() => {
    if (!needRefresh) {
      setBuildInfo(null);
      setBuildInfoFailed(false);
      setDismissedUpdate(false);
    }
  }, [needRefresh]);

  const checkForUpdates = useCallback(async () => {
    setStatus('checking');
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (!registration) {
        setStatus('noServiceWorker');
        return;
      }

      await registration.update();
      if (registration.waiting) {
        setNeedRefresh(true);
        setStatus('idle');
      } else {
        setStatus('upToDate');
      }
    } catch (error) {
      console.error('Failed to check for app updates:', error);
      setStatus('failed');
    }
  }, [setNeedRefresh]);

  const installUpdate = useCallback(async () => {
    setIsInstalling(true);
    setStatus('idle');
    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Failed to install the app update:', error);
      setStatus('installFailed');
      setIsInstalling(false);
    }
  }, [updateServiceWorker]);

  const skipUpdate = useCallback(() => {
    if (buildInfo) {
      try {
        window.localStorage.setItem(SKIPPED_BUILD_KEY, buildInfo.builtAt);
        setSkippedBuild(buildInfo.builtAt);
      } catch (error) {
        console.error('Could not save the skipped app update:', error);
      }
    }
    setDismissedUpdate(true);
  }, [buildInfo]);

  const value = useMemo(
    () => ({
      updateAvailable: needRefresh,
      updateVersion: buildInfo?.version,
      status,
      isChecking: status === 'checking',
      isInstalling,
      checkForUpdates,
      installUpdate,
    }),
    [
      buildInfo?.version,
      checkForUpdates,
      installUpdate,
      isInstalling,
      needRefresh,
      status,
    ],
  );
  const updateIsSkipped = Boolean(
    buildInfo && skippedBuild === buildInfo.builtAt,
  );
  const isPromptOpen =
    needRefresh &&
    (buildInfo !== null || buildInfoFailed) &&
    !dismissedUpdate &&
    !updateIsSkipped;

  return (
    <AppUpdateContext.Provider value={value}>
      {children}
      <Dialog
        open={isPromptOpen}
        onOpenChange={(open) => {
          if (!open) skipUpdate();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.updateAvailableTitle')}</DialogTitle>
            <DialogDescription>
              {buildInfo
                ? t('settings.updateAvailableDescription', {
                    version: buildInfo.version,
                  })
                : t('settings.updateAvailableUnknown')}
              {buildInfoFailed && (
                <span className="mt-2 block">
                  {t('settings.updateVersionUnavailable')}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={skipUpdate}
              disabled={isInstalling}
            >
              {t('settings.skipThisVersion')}
            </Button>
            <Button
              type="button"
              onClick={() => void installUpdate()}
              disabled={isInstalling}
            >
              {isInstalling
                ? t('settings.installingUpdate')
                : t('settings.installUpdate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppUpdateContext.Provider>
  );
}
