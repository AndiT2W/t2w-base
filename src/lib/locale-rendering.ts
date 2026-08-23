import type { Locale } from "./i18n";

export type TranslationCatalog = Record<string, string>;

export type LocaleRenderer = {
  translateKey: (key: string) => string;
  translateText: (value: string) => string;
  formatDate: (iso: string) => string;
  formatNumber: (value: number) => string;
};

const localeConfig: Record<Locale, { intl: string }> = {
  de: { intl: "de-DE" },
  en: { intl: "en-GB" },
};

export function createLocaleRenderer(
  locale: Locale,
  catalogs: Record<Locale, TranslationCatalog>,
  legacyTextCatalog: TranslationCatalog,
): LocaleRenderer {
  const catalog = catalogs[locale];
  const fallback = catalogs.de;
  const intlLocale = localeConfig[locale].intl;

  return {
    translateKey: (key) => catalog[key] ?? fallback[key] ?? key,
    translateText: (value) =>
      locale === "de" ? value : legacyTextCatalog[value] ?? value,
    formatDate: (iso) => new Intl.DateTimeFormat(intlLocale).format(new Date(`${iso}T00:00:00`)),
    formatNumber: (value) => new Intl.NumberFormat(intlLocale).format(value),
  };
}
