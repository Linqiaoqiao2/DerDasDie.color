'use client'

import { useLanguage } from '../i18n'

const langs = [
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'de', label: '🇩🇪 DE' },
  { code: 'zh', label: '🇨🇳 中文' },
]

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex gap-1">
      {langs.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
            language === code
              ? 'bg-amber-400 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-amber-50 border border-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
