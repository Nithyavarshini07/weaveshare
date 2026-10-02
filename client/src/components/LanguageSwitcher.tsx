import { useTranslation } from 'react-i18next';

type LanguageCode = 'en' | 'ta' | 'hi';

const languages: Array<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' },
];

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const activeLanguage = (i18n.resolvedLanguage || i18n.language).split('-')[0];

  return (
    <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-soft" role="group" aria-label={t('language.select')}>
      {languages.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => void i18n.changeLanguage(code)}
          aria-label={`${t('language.select')}: ${label}`}
          aria-pressed={activeLanguage === code}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeLanguage === code ? 'bg-brand-teal text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
