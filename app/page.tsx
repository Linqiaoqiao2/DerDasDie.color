'use client'

import { useState } from 'react'
import ReadingMode from './components/ReadingMode'
import StudyMode from './components/StudyMode'
import LanguageSwitcher from './components/LanguageSwitcher'
import FileUpload from './components/FileUpload'
import { useLanguage } from './i18n'
import { CatIcon, PawIcon, StarIcon, UploadIcon, BookIcon, EditIcon, LoaderIcon } from './components/Icons'
import styles from './page.module.css'

const pawPrintStyles = [
  styles.pawPrint1,
  styles.pawPrint2,
  styles.pawPrint3,
  styles.pawPrint4,
  styles.pawPrint5,
  styles.pawPrint6,
]

const bulletStyles = [
  styles.bulletSky,
  styles.bulletRose,
  styles.bulletEmerald,
  styles.bulletAmber,
  styles.bulletPurple,
]

const articleColorGuide = [
  { dotStyle: styles.dotSky, article: 'der' },
  { dotStyle: styles.dotRose, article: 'die' },
  { dotStyle: styles.dotEmerald, article: 'das' },
]

export default function Home() {
  const { t } = useLanguage()

  const [inputText, setInputText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzedNouns, setAnalyzedNouns] = useState<any[]>([])
  const [analyzedArticles, setAnalyzedArticles] = useState<any[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isReadingMode, setIsReadingMode] = useState(false)
  const [isStudyMode, setIsStudyMode] = useState(false)
  const [inputMethod, setInputMethod] = useState<'text' | 'upload'>('text')

  const handleAnalyzeText = async () => {
    if (!inputText.trim()) {
      setErrorMessage(t.home.errorEmpty)
      return
    }
    setIsAnalyzing(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      })
      if (!response.ok) {
        throw new Error((await response.json()).error || t.home.errorAnalysis)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Stream not available')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.error) throw new Error(data.error)
              if (data.done) {
                setAnalyzedNouns(data.nouns || [])
                setAnalyzedArticles(data.articles || [])
                setIsReadingMode(true)
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || t.home.errorGeneric)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (isStudyMode) {
    return <StudyMode onBack={() => setIsStudyMode(false)} />
  }
  if (isReadingMode) {
    return (
      <ReadingMode
        originalText={inputText}
        nouns={analyzedNouns}
        articles={analyzedArticles}
        onBack={() => setIsReadingMode(false)}
      />
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pawPrintsBackground}>
        {pawPrintStyles.map((pawStyle, index) => (
          <PawIcon key={index} className={`${styles.pawPrint} ${pawStyle}`} />
        ))}
      </div>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <LanguageSwitcher />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.mainContent}>
          <div className={styles.heroSection}>
            <div className={styles.heroTitle}>
              <CatIcon className={styles.catIconLarge} />
              <div>
                <h1 className={styles.appTitle}>
                  <span className={styles.titleDer}>Der</span>
                  <span className={styles.titleDie}>Die</span>
                  <span className={styles.titleDas}>Das</span>
                </h1>
                <p className={styles.subtitle}>{t.home.subtitle}</p>
              </div>
            </div>
            <p className={styles.description}>{t.home.description}</p>
          </div>

          <div className={styles.vocabularyButtonContainer}>
            <button
              onClick={() => setIsStudyMode(true)}
              className={styles.vocabularyButton}
            >
              <BookIcon className={styles.iconSmall} />
              {t.home.vocabularyBook}
            </button>
          </div>

          <div className={styles.inputCard}>
            <div className={styles.tabSwitcher}>
              <button
                onClick={() => setInputMethod('text')}
                className={`${styles.tabButton} ${inputMethod === 'text' ? styles.tabButtonActive : ''}`}
              >
                <EditIcon className={styles.iconTiny} />
                {t.home.inputLabel}
              </button>
              <span className={styles.tabDivider}>|</span>
              <button
                onClick={() => setInputMethod('upload')}
                className={`${styles.tabButton} ${inputMethod === 'upload' ? styles.tabButtonActive : ''}`}
              >
                <UploadIcon className={styles.iconTiny} />
                {t.upload.title}
              </button>
            </div>

            {inputMethod === 'upload' ? (
              <div className={styles.inputArea}>
                <FileUpload
                  onTextExtracted={(extractedText) => {
                    setInputText(extractedText)
                    setInputMethod('text')
                  }}
                  disabled={isAnalyzing}
                />
              </div>
            ) : (
              <div className={styles.inputArea}>
                <textarea
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  placeholder={t.home.inputPlaceholder}
                  disabled={isAnalyzing}
                  className={styles.textarea}
                />
                <p className={styles.inputHint}>
                  <PawIcon className={styles.iconTiny} />
                  {t.home.inputHint}
                </p>
              </div>
            )}

            {errorMessage && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                {errorMessage}
              </div>
            )}

            <button
              onClick={handleAnalyzeText}
              disabled={isAnalyzing || !inputText.trim()}
              className={styles.analyzeButton}
            >
              {isAnalyzing ? (
                <>
                  <LoaderIcon className={styles.iconMedium} />
                  {t.home.analyzing}
                </>
              ) : (
                <>
                  <CatIcon className={styles.iconMedium} />
                  {t.home.analyzeButton}
                </>
              )}
            </button>
          </div>

          <div className={styles.featuresCard}>
            <h3 className={styles.featuresTitle}>
              <StarIcon className={styles.starIcon} />
              {t.home.features.title}
            </h3>

            <div className={styles.featureList}>
              {[
                t.home.features.item1,
                t.home.features.item2,
                t.home.features.item3,
                t.home.features.item4,
                `${t.study.vocabularyBook}: ${t.home.features.item5}`
              ].map((featureText, index) => (
                <div key={index} className={styles.featureItem}>
                  <div className={`${styles.featureBullet} ${bulletStyles[index]}`} />
                  <p className={styles.featureText}>{featureText}</p>
                </div>
              ))}
            </div>

            <div className={styles.colorGuide}>
              {articleColorGuide.map(({ dotStyle, article }) => (
                <div key={article} className={styles.colorGuideItem}>
                  <span className={`${styles.colorDot} ${dotStyle}`} />
                  <span className={styles.colorLabel}>{article}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.footerContent}>
              <CatIcon className={styles.footerCat} />
              <span className={styles.footerText}>Miau! 🐾</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
