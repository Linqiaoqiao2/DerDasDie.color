'use client'

import { useState } from 'react'
import { useTTS } from '../hooks/useTTS'
import { useFavorites } from '../hooks/useFavorites'
import { exportToCSV } from '../lib/export'
import { useLanguage } from '../i18n'
import LanguageSwitcher from './LanguageSwitcher'
import { CatIcon, PawIcon, ArrowLeftIcon, BookIcon, LayersIcon, TrashIcon, CheckIcon, XIcon, VolumeIcon, DownloadIcon } from './Icons'

const colors: Record<string, string> = { m: 'text-sky-500', f: 'text-rose-400', n: 'text-emerald-500', pl: 'text-purple-500' }
const bgColors: Record<string, string> = { m: 'bg-sky-400', f: 'bg-rose-400', n: 'bg-emerald-400', pl: 'bg-purple-400' }
const gradients: Record<string, string> = { m: 'from-sky-400 to-sky-600', f: 'from-rose-400 to-rose-600', n: 'from-emerald-400 to-emerald-600', pl: 'from-purple-400 to-purple-600' }
const labels: Record<string, string> = { m: 'der', f: 'die', n: 'das', pl: 'die' }

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
      <div className="text-center py-12">
        <CatIcon className="mx-auto mb-4 w-16 h-16 text-amber-300" />
        <p className="text-xl font-semibold text-gray-700">{t.study.noWords}</p>
        <button onClick={() => setView('list')} className="mt-4 px-6 py-2 bg-amber-100 hover:bg-amber-200 rounded-full font-semibold text-amber-700">{t.study.returnToList}</button>
      </div>
    )

    const w = favorites[cardIdx]
    return (
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2"><span>{t.study.progress}</span><span>{cardIdx + 1} / {favorites.length}</span></div>
          <div className="h-3 bg-amber-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${((cardIdx + 1) / favorites.length) * 100}%` }} /></div>
        </div>

        <div className="h-72 cursor-pointer" onClick={() => setFlipped(!flipped)}>
          {!flipped ? (
            <div className={`h-full rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 bg-gradient-to-br ${gradients[w.gender]}`}>
              <p className="text-white/70 text-sm mb-2">{t.study.clickToFlip}</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-white">{w.lemma}</span>
                <button onClick={e => { e.stopPropagation(); speak(w.lemma) }} className="p-2 bg-white/20 hover:bg-white/30 rounded-full">
                  <VolumeIcon className={`w-6 h-6 text-white ${isSpeaking ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 border-4 border-amber-100">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-5xl font-bold ${colors[w.gender]}`}>{labels[w.gender]}</span>
                <button onClick={e => { e.stopPropagation(); speak(`${labels[w.gender]} ${w.lemma}`) }} className="p-2 text-gray-400 hover:text-amber-500 rounded-full">
                  <VolumeIcon className={`w-6 h-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
                </button>
              </div>
              <span className="text-2xl font-semibold text-gray-800 mb-2">{w.lemma}</span>
              {(w.translation_zh || w.translation_en) && (
                <div className="text-gray-500 text-center">
                  {w.translation_zh && <p>{w.translation_zh}</p>}
                  {w.translation_en && <p className="text-sm">{w.translation_en}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {flipped && (
          <div className="flex gap-4 mt-6">
            <button onClick={next} className="flex-1 flex items-center justify-center gap-2 py-4 bg-rose-100 text-rose-600 rounded-2xl hover:bg-rose-200 font-bold"><XIcon className="w-5 h-5" /> {t.study.forgot}</button>
            <button onClick={next} className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-100 text-emerald-600 rounded-2xl hover:bg-emerald-200 font-bold"><CheckIcon className="w-5 h-5" /> {t.study.remembered}</button>
          </div>
        )}
        {!flipped && <p className="text-center mt-6 text-gray-500 text-sm"><PawIcon className="inline w-4 h-4 text-amber-400 mr-1" />{t.study.clickCardToSeeAnswer}</p>}
      </div>
    )
  }

  const renderList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2"><BookIcon className="w-6 h-6 text-amber-500" /><span className="text-lg font-bold text-gray-700">{favorites.length} {t.study.totalWords}</span></div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(favorites)} disabled={!favorites.length} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-full shadow-md disabled:opacity-50"><DownloadIcon className="w-5 h-5" /><span className="hidden sm:inline">CSV</span></button>
          <button onClick={() => { setCardIdx(0); setFlipped(false); setView('flashcard') }} disabled={!favorites.length} className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-white rounded-full hover:bg-amber-500 disabled:opacity-50 font-bold"><LayersIcon className="w-5 h-5" />{t.study.flashcardMode}</button>
        </div>
      </div>

      {!favorites.length ? (
        <div className="text-center py-12 text-gray-500">
          <CatIcon className="mx-auto mb-4 w-16 h-16 text-amber-200" />
          <p className="font-semibold text-gray-600">{t.study.noWords}</p>
          <p className="text-sm mt-2">{t.study.noWordsHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map(w => (
            <div key={w.lemma} className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-amber-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-10 rounded-full ${bgColors[w.gender]}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${colors[w.gender]}`}>{labels[w.gender]}</span>
                    <span className="font-semibold text-gray-800">{w.lemma}</span>
                    <button onClick={() => speak(`${labels[w.gender]} ${w.lemma}`)} className="p-1 text-gray-400 hover:text-amber-500 rounded-full">
                      <VolumeIcon className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                  {(w.translation_zh || w.translation_en) && <p className="text-sm text-gray-500 mt-1">{w.translation_zh || w.translation_en}</p>}
                </div>
              </div>
              <button onClick={() => removeFavorite(w.lemma)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"><TrashIcon className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-amber-50" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <PawIcon className="absolute top-20 left-10 w-8 h-8 text-amber-200 rotate-[-20deg]" />
        <PawIcon className="absolute top-40 right-20 w-6 h-6 text-rose-200 rotate-[15deg]" />
        <PawIcon className="absolute bottom-32 left-20 w-10 h-10 text-sky-200 rotate-[-10deg]" />
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={view === 'list' ? onBack : () => setView('list')} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-amber-50 rounded-full shadow-md font-semibold text-gray-700">
              <ArrowLeftIcon className="w-5 h-5" />{view === 'list' ? t.study.backToHome : t.study.backToList}
            </button>
            <div className="flex items-center gap-3">
              <CatIcon className="w-8 h-8 text-amber-400" />
              <h1 className="text-xl font-bold" style={{ fontFamily: "'Quicksand', sans-serif" }}>{view === 'list' ? t.study.vocabularyBook : t.study.flashcardReview}</h1>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-amber-100">
            {view === 'list' ? renderList() : renderFlashcard()}
          </div>
        </div>
      </div>
    </div>
  )
}
