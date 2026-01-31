'use client'

import { useState } from 'react'
import { useTTS } from '../hooks/useTTS'
import { useFavorites } from '../hooks/useFavorites'
import { useLanguage } from '../i18n'
import LanguageSwitcher from './LanguageSwitcher'
import { CatIcon, PawIcon, StarIcon, VolumeIcon, XIcon, ArrowLeftIcon } from './Icons'

const colors: Record<string, string> = { m: 'text-sky-500', f: 'text-rose-400', n: 'text-emerald-500', pl: 'text-purple-500' }
const labels: Record<string, string> = { m: 'der', f: 'die', n: 'das', pl: 'die' }

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

  const caseNames: Record<string, string> = { nominativ: t.cases.nominativ, genitiv: t.cases.genitiv, dativ: t.cases.dativ, akkusativ: t.cases.akkusativ }

  return (
    <div className="min-h-screen bg-amber-50" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <PawIcon className="absolute top-20 left-10 w-8 h-8 text-amber-200 rotate-[-20deg]" />
        <PawIcon className="absolute top-40 right-20 w-6 h-6 text-rose-200 rotate-[15deg]" />
        <PawIcon className="absolute bottom-32 left-20 w-10 h-10 text-sky-200 rotate-[-10deg]" />
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-amber-50 rounded-full shadow-md font-semibold text-gray-700">
              <ArrowLeftIcon className="w-5 h-5" /> {t.reading.backToEdit}
            </button>
            <div className="flex items-center gap-3">
              <CatIcon className="w-8 h-8 text-amber-400" />
              <h1 className="text-xl font-bold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                <span className="text-sky-500">Der</span><span className="text-rose-400">Die</span><span className="text-emerald-500">Das</span>
              </h1>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-amber-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800" style={{ fontFamily: "'Quicksand', sans-serif" }}>{t.reading.title}</h2>

            <div className="mb-6 p-4 bg-amber-50 rounded-2xl border-2 border-amber-100">
              <p className="text-sm font-semibold mb-3 text-gray-700">{t.reading.colorLegend}</p>
              <div className="flex flex-wrap gap-6 text-sm">
                {['m', 'f', 'n'].map(g => (
                  <div key={g} className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full ${g === 'm' ? 'bg-sky-400' : g === 'f' ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                    <span className={colors[g] + ' font-semibold'}>{labels[g]} ({g === 'm' ? t.gender.masculine : g === 'f' ? t.gender.feminine : t.gender.neuter})</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 pt-3 border-t border-amber-200 text-xs text-gray-500">{t.reading.foundNouns}: {nouns.length} | {t.reading.foundArticles}: {articles.length}</p>
            </div>

            <div className="text-lg leading-relaxed mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              {parseText().map((token, idx) => {
                if (token.isNoun && token.nounData && token.nounData.gender !== 'pl') {
                  return (
                    <span key={idx} className={`cursor-pointer font-bold ${colors[token.nounData.gender]} underline decoration-2 underline-offset-2 hover:opacity-70`}
                      onClick={() => handleClick(token.nounData)} title={`${labels[token.nounData.gender]} ${token.nounData.lemma}`}>{token.text}</span>
                  )
                }
                if (token.isArticle && token.articleData && token.articleData.gender !== 'pl') {
                  return <span key={idx} className={`font-bold ${colors[token.articleData.gender]}`}>{token.text}</span>
                }
                return <span key={idx}>{token.text}</span>
              })}
            </div>

            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <PawIcon className="w-4 h-4 text-amber-400" /><span>{t.reading.clickNounHint}</span>
            </div>
          </div>

          {selected && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={close}>
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-2 border-amber-100" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                        <span className={colors[selected.gender]}>{labels[selected.gender]}</span> {selected.lemma}
                      </h3>
                      <button onClick={() => speak(`${labels[selected.gender]} ${selected.lemma}`)} className="p-2 text-gray-400 hover:text-amber-500 rounded-full">
                        <VolumeIcon className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{t.reading.original}: {selected.original}</p>
                    {selected.translation_zh && <p className="text-sm text-gray-600 mt-1">{t.reading.chinese}: {selected.translation_zh}</p>}
                    {selected.translation_en && <p className="text-sm text-gray-600 mt-1">{t.reading.english}: {selected.translation_en}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleFavorite(selected)} className={`p-2 rounded-full ${isFavorited(selected.lemma) ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}>
                      <StarIcon className="w-5 h-5" filled={isFavorited(selected.lemma)} />
                    </button>
                    <button onClick={close} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><XIcon className="w-5 h-5" /></button>
                  </div>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-gray-500">
                    <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t.reading.loadingDeclension}
                  </div>
                ) : declension?.cases ? (
                  <div className="border-t-2 border-amber-100 pt-4">
                    <h4 className="font-semibold mb-4 text-gray-700">{t.reading.declensionTitle}</h4>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-amber-100">
                          <th className="text-left py-2 px-3 font-semibold text-gray-600 text-sm">{t.reading.caseHeader}</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-600 text-sm">{t.reading.articleHeader}</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-600 text-sm">{t.reading.nounFormHeader}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {declension.cases.map((c: any, i: number) => (
                          <tr key={c.case} className={i < declension.cases.length - 1 ? 'border-b border-gray-100' : ''}>
                            <td className="py-3 px-3 font-medium text-gray-600 text-sm">{caseNames[c.case] || c.case}</td>
                            <td className="py-3 px-3"><span className={`font-bold text-lg ${colors[selected.gender]}`}>{c.article}</span></td>
                            <td className="py-3 px-3 font-semibold text-gray-800">{c.nounForm}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div className="border-t-2 border-amber-100 pt-4 text-center text-gray-500">{t.reading.cannotLoadDeclension}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
