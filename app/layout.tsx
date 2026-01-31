import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from './i18n'
import styles from './layout.module.css'

export const metadata: Metadata = {
  title: 'DerDieDas Color Reader',
  description: 'German Gender Color-Mapping Reader - Genus-Farbmarkierungs-Leser',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={styles.body}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
