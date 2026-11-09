import { useTranslation } from 'react-i18next';

export function useTranslate(
  ns?: string | string[] | undefined,
  options?: Parameters<typeof useTranslation>[1],
) {
  const { t, i18n, ...rest } = useTranslation(ns, options);
  return { t, i18n, ...rest };
}

export { useTranslation };
