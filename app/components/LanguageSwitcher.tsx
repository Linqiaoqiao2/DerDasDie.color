'use client'

import { useLanguage } from '../i18n'
import styles from './LanguageSwitcher.module.css'

const langs = [
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'de', label: '🇩🇪 DE' },
  { code: 'zh', label: '🇨🇳 中文' },
]

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className={styles.container}>
      {langs.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={`${styles.languageButton} ${language === code ? styles.languageButtonActive : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
