import { createContext, useContext } from 'react';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'upToDate'
  | 'failed'
  | 'noServiceWorker'
  | 'installFailed';

export interface AppUpdateContextValue {
  updateAvailable: boolean;
  updateVersion?: string;
  status: UpdateStatus;
  isChecking: boolean;
  isInstalling: boolean;
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

export const AppUpdateContext = createContext<AppUpdateContextValue | null>(
  null,
);

export function useAppUpdate() {
  const context = useContext(AppUpdateContext);
  if (!context) {
    throw new Error('useAppUpdate must be used within AppUpdateManager.');
  }
  return context;
}
