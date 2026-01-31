'use client'

import { useState } from 'react'
import { useTTS } from '../hooks/useTTS'
import { useFavorites } from '../hooks/useFavorites'
import { exportToCSV } from '../lib/export'
import { useLanguage } from '../i18n'
import { GENDER_LABELS } from '../lib/constants'
import LanguageSwitcher from './LanguageSwitcher'
import { CatIcon, PawIcon, ArrowLeftIcon, BookIcon, LayersIcon, TrashIcon, CheckIcon, XIcon, VolumeIcon, DownloadIcon } from './Icons'
import styles from './StudyMode.module.css'

const genderLabelStyles: Record<string, string> = { m: styles.genderM, f: styles.genderF, n: styles.genderN, pl: styles.genderPl }
const genderBarStyles: Record<string, string> = { m: styles.genderBarM, f: styles.genderBarF, n: styles.genderBarN, pl: styles.genderBarPl }
const gradientStyles: Record<string, string> = { m: styles.gradientM, f: styles.gradientF, n: styles.gradientN, pl: styles.gradientPl }

export default function StudyMode({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage()
  const { favorites, removeFavorite } = useFavorites()
  const { speak, isSpeaking } = useTTS()
  const [view, setView] = useState<'list' | 'flashcard'>('list')
  const [cardIdx, setCardIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const next = () => cardIdx < favorites.length - 1 ? (setCardIdx(cardIdx + 1), setFlipped(false)) : setView('list')

  const renderFlashcard = () => {
    if (!favorites.length) return (
      <div className={styles.emptyState}>
        <CatIcon className={styles.emptyIcon} />
        <p className={styles.emptyTitle}>{t.study.noWords}</p>
        <button onClick={() => setView('list')} className={styles.returnButton}>
          {t.study.returnToList}
        </button>
      </div>
    )

    const w = favorites[cardIdx]
    return (
      <div className={styles.flashcardWrapper}>
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>{t.study.progress}</span>
            <span>{cardIdx + 1} / {favorites.length}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((cardIdx + 1) / favorites.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.flashcard} onClick={() => setFlipped(!flipped)}>
          {!flipped ? (
            <div className={`${styles.flashcardFront} ${gradientStyles[w.gender]}`}>
              <p className={styles.flipHint}>{t.study.clickToFlip}</p>
              <div className={styles.frontContent}>
                <span className={styles.frontWord}>{w.lemma}</span>
                <button
                  onClick={e => { e.stopPropagation(); speak(w.lemma) }}
                  className={styles.speakButtonLarge}
                >
                  <VolumeIcon className={`${styles.frontSpeakIcon} ${isSpeaking ? styles.iconPulsing : ''}`} />
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.flashcardBack}>
              <div className={styles.backArticle}>
                <span className={`${styles.backArticleText} ${genderLabelStyles[w.gender]}`}>
                  {GENDER_LABELS[w.gender]}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); speak(`${GENDER_LABELS[w.gender]} ${w.lemma}`) }}
                  className={styles.speakButtonFlipped}
                >
                  <VolumeIcon className={`${styles.backSpeakIcon} ${isSpeaking ? styles.iconPulsing : ''}`} />
                </button>
              </div>
              <span className={styles.backWord}>{w.lemma}</span>
              {(w.translation_zh || w.translation_en) && (
                <div className={styles.backTranslation}>
                  {w.translation_zh && <p className={styles.backTranslationZh}>{w.translation_zh}</p>}
                  {w.translation_en && <p className={styles.backTranslationEn}>{w.translation_en}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {flipped && (
          <div className={styles.flashcardActions}>
            <button onClick={next} className={styles.forgotButton}>
              <XIcon className={styles.iconSmall} /> {t.study.forgot}
            </button>
            <button onClick={next} className={styles.rememberedButton}>
              <CheckIcon className={styles.iconSmall} /> {t.study.remembered}
            </button>
          </div>
        )}
        {!flipped && (
          <p className={styles.flashcardHint}>
            <PawIcon className={styles.hintPaw} />
            {t.study.clickCardToSeeAnswer}
          </p>
        )}
      </div>
    )
  }

  const renderList = () => (
    <div>
      <div className={styles.listHeader}>
        <div className={styles.wordCount}>
          <BookIcon className={styles.bookIcon} />
          <span className={styles.wordCountText}>{favorites.length} {t.study.totalWords}</span>
        </div>
        <div className={styles.listActions}>
          <button
            onClick={() => exportToCSV(favorites)}
            disabled={!favorites.length}
            className={styles.exportButton}
          >
            <DownloadIcon className={styles.iconSmall} />
            <span className={styles.hideOnMobile}>CSV</span>
          </button>
          <button
            onClick={() => { setCardIdx(0); setFlipped(false); setView('flashcard') }}
            disabled={!favorites.length}
            className={styles.flashcardButton}
          >
            <LayersIcon className={styles.iconSmall} />
            {t.study.flashcardMode}
          </button>
        </div>
      </div>

      {!favorites.length ? (
        <div className={styles.emptyState}>
          <CatIcon className={styles.emptyIconLight} />
          <p className={styles.emptySubtitle}>{t.study.noWords}</p>
          <p className={styles.emptyHint}>{t.study.noWordsHint}</p>
        </div>
      ) : (
        <div className={styles.wordList}>
          {favorites.map(w => (
            <div key={w.lemma} className={styles.wordItem}>
              <div className={styles.wordContent}>
                <div className={`${styles.genderBar} ${genderBarStyles[w.gender]}`} />
                <div className={styles.wordInfo}>
                  <div className={styles.wordHeader}>
                    <span className={`${styles.genderLabel} ${genderLabelStyles[w.gender]}`}>
                      {GENDER_LABELS[w.gender]}
                    </span>
                    <span className={styles.wordLemma}>{w.lemma}</span>
                    <button
                      onClick={() => speak(`${GENDER_LABELS[w.gender]} ${w.lemma}`)}
                      className={styles.speakButton}
                    >
                      <VolumeIcon className={`${styles.iconTiny} ${isSpeaking ? styles.iconPulsing : ''}`} />
                    </button>
                  </div>
                  {(w.translation_zh || w.translation_en) && (
                    <p className={styles.translation}>{w.translation_zh || w.translation_en}</p>
                  )}
                </div>
              </div>
              <button onClick={() => removeFavorite(w.lemma)} className={styles.deleteButton}>
                <TrashIcon className={styles.iconSmall} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className={styles.pageContainer}>
      <div className={styles.backgroundDecorations}>
        <PawIcon className={`${styles.pawPrint} ${styles.pawPrint1}`} />
        <PawIcon className={`${styles.pawPrint} ${styles.pawPrint2}`} />
        <PawIcon className={`${styles.pawPrint} ${styles.pawPrint3}`} />
      </div>

      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.header}>
            <button
              onClick={view === 'list' ? onBack : () => setView('list')}
              className={styles.backButton}
            >
              <ArrowLeftIcon className={styles.iconSmall} />
              {view === 'list' ? t.study.backToHome : t.study.backToList}
            </button>
            <div className={styles.headerTitle}>
              <CatIcon className={styles.catIcon} />
              <h1 className={styles.pageTitle}>
                {view === 'list' ? t.study.vocabularyBook : t.study.flashcardReview}
              </h1>
            </div>
            <LanguageSwitcher />
          </div>

          <div className={styles.cardContainer}>
            {view === 'list' ? renderList() : renderFlashcard()}
          </div>
        </div>
      </div>
    </div>
  )
}
