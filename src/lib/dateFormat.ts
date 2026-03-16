import i18n from '@/i18n';

const localeMap: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  it: 'it-IT',
  fr: 'fr-FR',
};

function getLocale(): string {
  return localeMap[i18n.language] || 'en-US';
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(getLocale(), options || { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat(getLocale(), {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat(getLocale(), {
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(date));
}

export function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric' }).format(new Date(date));
}

export function formatLongDate(date: Date | string): string {
  return new Intl.DateTimeFormat(getLocale(), { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
}
