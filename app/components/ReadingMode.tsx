'use client'

import { useState } from 'react'
import { useTTS } from '../hooks/useTTS'
import { useFavorites } from '../hooks/useFavorites'
import { useLanguage } from '../i18n'
import { GENDER_LABELS } from '../lib/constants'
import LanguageSwitcher from './LanguageSwitcher'
import { CatIcon, PawIcon, StarIcon, VolumeIcon, XIcon, ArrowLeftIcon } from './Icons'
import styles from './ReadingMode.module.css'

const genderStyles: Record<string, string> = { m: styles.genderM, f: styles.genderF, n: styles.genderN, pl: styles.genderPl }

export default function ReadingMode({ originalText, nouns, articles, onBack }: { originalText: string; nouns: any[]; articles: any[]; onBack: () => void }) {
  const { t } = useLanguage()
  const { speak, isSpeaking } = useTTS()
  const { toggleFavorite, isFavorited } = useFavorites()
  const [selected, setSelected] = useState<any>(null)
  const [declension, setDeclension] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDeclension = async (noun: any) => {
    setLoading(true)
    try {
      const res = await fetch('/api/declension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lemma: noun.lemma, gender: noun.gender, original: noun.original }),
      })
      if (res.ok) setDeclension(await res.json())
    } finally { setLoading(false) }
  }

  const handleClick = (noun: any) => {
    if (noun.gender === 'pl') return
    setSelected(noun)
    fetchDeclension(noun)
  }

  const close = () => { setSelected(null); setDeclension(null) }

  const parseText = () => {
    const tokens: any[] = []
    const usedN = new Set<number>(), usedA = new Set<number>()
    
    originalText.split(/(\s+)/).forEach((word, idx) => {
      if (!word.trim()) { tokens.push({ text: word, isNoun: false, index: idx }); return }
      const clean = word.replace(/[.,!?;:()\[\]{}'"]/g, '').toLowerCase()
      
      for (let i = 0; i < nouns.length; i++) {
        if (!usedN.has(i) && clean === nouns[i].original.toLowerCase()) {
          tokens.push({ text: word, isNoun: true, nounData: nouns[i], index: idx })
          usedN.add(i); return
        }
      }
      for (let i = 0; i < articles.length; i++) {
        if (!usedA.has(i) && clean === articles[i].original.toLowerCase()) {
          tokens.push({ text: word, isNoun: false, isArticle: true, articleData: articles[i], index: idx })
          usedA.add(i); return
        }
      }
      tokens.push({ text: word, isNoun: false, index: idx })
    })
    return tokens
  }

  const caseNames: Record<string, string> = {
    nominativ: t.cases.nominativ,
    genitiv: t.cases.genitiv,
    dativ: t.cases.dativ,
    akkusativ: t.cases.akkusativ
  }

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
            <button onClick={onBack} className={styles.backButton}>
              <ArrowLeftIcon className={styles.iconSmall} /> {t.reading.backToEdit}
            </button>
            <div className={styles.headerTitle}>
              <CatIcon className={styles.catIcon} />
              <h1 className={styles.appTitle}>
                <span className={styles.titleDer}>Der</span>
                <span className={styles.titleDie}>Die</span>
                <span className={styles.titleDas}>Das</span>
              </h1>
            </div>
            <LanguageSwitcher />
          </div>

          <div className={styles.mainCard}>
            <h2 className={styles.mainTitle}>{t.reading.title}</h2>

            <div className={styles.legendBox}>
              <p className={styles.legendTitle}>{t.reading.colorLegend}</p>
              <div className={styles.legendItems}>
                {['m', 'f', 'n'].map(g => (
                  <div key={g} className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${g === 'm' ? styles.dotSky : g === 'f' ? styles.dotRose : styles.dotEmerald}`} />
                    <span className={`${styles.legendLabel} ${genderStyles[g]}`}>
                      {GENDER_LABELS[g]} ({g === 'm' ? t.gender.masculine : g === 'f' ? t.gender.feminine : t.gender.neuter})
                    </span>
                  </div>
                ))}
              </div>
              <p className={styles.legendStats}>
                {t.reading.foundNouns}: {nouns.length} | {t.reading.foundArticles}: {articles.length}
              </p>
            </div>

            <div className={styles.readingArea}>
              {parseText().map((token, idx) => {
                if (token.isNoun && token.nounData && token.nounData.gender !== 'pl') {
                  return (
                    <span
                      key={idx}
                      className={`${styles.nounHighlight} ${genderStyles[token.nounData.gender]}`}
                      onClick={() => handleClick(token.nounData)}
                      title={`${GENDER_LABELS[token.nounData.gender]} ${token.nounData.lemma}`}
                    >
                      {token.text}
                    </span>
                  )
                }
                if (token.isArticle && token.articleData && token.articleData.gender !== 'pl') {
                  return (
                    <span key={idx} className={`${styles.articleHighlight} ${genderStyles[token.articleData.gender]}`}>
                      {token.text}
                    </span>
                  )
                }
                return <span key={idx}>{token.text}</span>
              })}
            </div>

            <div className={styles.hint}>
              <PawIcon className={styles.hintPaw} />
              <span>{t.reading.clickNounHint}</span>
            </div>
          </div>

          {selected && (
            <div className={styles.modalOverlay} onClick={close}>
              <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <div>
                    <div className={styles.modalTitleRow}>
                      <h3 className={styles.modalTitle}>
                        <span className={genderStyles[selected.gender]}>{GENDER_LABELS[selected.gender]}</span> {selected.lemma}
                      </h3>
                      <button
                        onClick={() => speak(`${GENDER_LABELS[selected.gender]} ${selected.lemma}`)}
                        className={styles.speakButton}
                      >
                        <VolumeIcon className={`${styles.iconSmall} ${isSpeaking ? styles.iconPulsing : ''}`} />
                      </button>
                    </div>
                    <p className={styles.modalInfo}>{t.reading.original}: {selected.original}</p>
                    {selected.translation_zh && (
                      <p className={styles.modalTranslation}>{t.reading.chinese}: {selected.translation_zh}</p>
                    )}
                    {selected.translation_en && (
                      <p className={styles.modalTranslation}>{t.reading.english}: {selected.translation_en}</p>
                    )}
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      onClick={() => toggleFavorite(selected)}
                      className={`${styles.favoriteButton} ${isFavorited(selected.lemma) ? styles.favoriteButtonActive : ''}`}
                    >
                      <StarIcon className={styles.iconSmall} filled={isFavorited(selected.lemma)} />
                    </button>
                    <button onClick={close} className={styles.closeButton}>
                      <XIcon className={styles.iconSmall} />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    {t.reading.loadingDeclension}
                  </div>
                ) : declension?.cases ? (
                  <div className={styles.declensionSection}>
                    <h4 className={styles.declensionTitle}>{t.reading.declensionTitle}</h4>
                    <table className={styles.declensionTable}>
                      <thead>
                        <tr className={styles.tableHeader}>
                          <th className={styles.tableHeaderCell}>{t.reading.caseHeader}</th>
                          <th className={styles.tableHeaderCell}>{t.reading.articleHeader}</th>
                          <th className={styles.tableHeaderCell}>{t.reading.nounFormHeader}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {declension.cases.map((c: any, i: number) => (
                          <tr
                            key={c.case}
                            className={i < declension.cases.length - 1 ? styles.tableRow : styles.tableRowLast}
                          >
                            <td className={`${styles.tableCell} ${styles.caseName}`}>
                              {caseNames[c.case] || c.case}
                            </td>
                            <td className={`${styles.tableCell} ${styles.articleCell} ${genderStyles[selected.gender]}`}>
                              {c.article}
                            </td>
                            <td className={`${styles.tableCell} ${styles.nounFormCell}`}>
                              {c.nounForm}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.errorState}>{t.reading.cannotLoadDeclension}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
