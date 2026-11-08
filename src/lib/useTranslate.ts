import { useTranslation, type UseTranslationOptions } from 'react-i18next';

export function useTranslate(ns?: string, options?: UseTranslationOptions<string, undefined>) {
  const { t, i18n, ...rest } = useTranslation(ns, options);
  return { t, i18n, ...rest };
}

export { useTranslation };
