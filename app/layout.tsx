import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from './i18n'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
