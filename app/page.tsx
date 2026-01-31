'use client'

import { useState } from 'react'
import ReadingMode from './components/ReadingMode'
import StudyMode from './components/StudyMode'
import LanguageSwitcher from './components/LanguageSwitcher'
import FileUpload from './components/FileUpload'
import { useLanguage } from './i18n'
import { CatIcon, PawIcon, StarIcon, UploadIcon, BookIcon, EditIcon, LoaderIcon } from './components/Icons'

const colors = ['sky', 'rose', 'emerald', 'amber', 'purple']
const colorClasses: Record<string, string> = { sky: 'bg-sky-400', rose: 'bg-rose-400', emerald: 'bg-emerald-400', amber: 'bg-amber-400', purple: 'bg-purple-400' }

export default function Home() {
  const { t } = useLanguage()
  const [text, setText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [nouns, setNouns] = useState<any[]>([])
  const [articles, setArticles] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showReading, setShowReading] = useState(false)
  const [showStudy, setShowStudy] = useState(false)
  const [inputMode, setInputMode] = useState<'text' | 'upload'>('text')

  const analyze = async () => {
    if (!text.trim()) { setError(t.home.errorEmpty); return }
    setAnalyzing(true); setError(null)

    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (!res.ok) throw new Error((await res.json()).error || t.home.errorAnalysis)

      const reader = res.body?.getReader()
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
              if (data.done) { setNouns(data.nouns || []); setArticles(data.articles || []); setShowReading(true) }
            } catch {}
          }
        }
      }
    } catch (e: any) { setError(e.message || t.home.errorGeneric) }
    finally { setAnalyzing(false) }
  }

  if (showStudy) return <StudyMode onBack={() => setShowStudy(false)} />
  if (showReading) return <ReadingMode originalText={text} nouns={nouns} articles={articles} onBack={() => setShowReading(false)} />

  return (
    <div className="min-h-screen bg-amber-50 relative overflow-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[['top-20 left-10', 8, 'amber', -20], ['top-40 right-20', 6, 'rose', 15], ['bottom-32 left-20', 10, 'sky', -10], ['top-60 left-1/4', 5, 'emerald', 30], ['bottom-48 right-1/3', 7, 'amber', -25], ['top-32 right-1/3', 6, 'rose', 5]].map(([pos, size, color, rot], i) => (
          <PawIcon key={i} className={`absolute ${pos} w-${size} h-${size} text-${color}-200 rotate-[${rot}deg]`} />
        ))}
      </div>

      <header className="relative z-10 pt-6 px-8"><div className="max-w-5xl mx-auto flex justify-end gap-2"><LanguageSwitcher /></div></header>

      <main className="relative z-10 px-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center pt-8 pb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <CatIcon className="w-14 h-14 text-amber-400" />
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                  <span className="text-sky-500">Der</span><span className="text-rose-400">Die</span><span className="text-emerald-500">Das</span>
                </h1>
                <p className="text-xl font-bold text-gray-700" style={{ fontFamily: "'Quicksand', sans-serif" }}>{t.home.subtitle}</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-3 max-w-md mx-auto">{t.home.description}</p>
          </div>

          <div className="flex justify-center mb-8">
            <button onClick={() => setShowStudy(true)} className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-white rounded-full font-semibold shadow-lg hover:bg-amber-500 hover:shadow-xl transition-all hover:-translate-y-0.5">
              <BookIcon className="w-5 h-5" />{t.home.vocabularyBook}
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-amber-100">
            <div className="flex items-center gap-1 mb-6">
              <button onClick={() => setInputMode('text')} className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm transition-all ${inputMode === 'text' ? 'text-gray-800 border-b-2 border-amber-400' : 'text-gray-400 hover:text-gray-600'}`}>
                <EditIcon className="w-4 h-4" />{t.home.inputLabel}
              </button>
              <span className="text-gray-300 mx-1">|</span>
              <button onClick={() => setInputMode('upload')} className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm transition-all ${inputMode === 'upload' ? 'text-gray-800 border-b-2 border-amber-400' : 'text-gray-400 hover:text-gray-600'}`}>
                <UploadIcon className="w-4 h-4" />{t.upload.title}
              </button>
            </div>

            {inputMode === 'upload' ? (
              <div className="mb-6"><FileUpload onTextExtracted={t => { setText(t); setInputMode('text') }} disabled={analyzing} /></div>
            ) : (
              <div className="mb-6">
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t.home.inputPlaceholder} disabled={analyzing}
                  className="w-full h-36 px-4 py-3 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all text-gray-700 disabled:opacity-50" />
                <p className="text-gray-400 text-sm mt-2 flex items-center gap-1"><PawIcon className="w-4 h-4" />{t.home.inputHint}</p>
              </div>
            )}

            {error && <div className="mb-4 p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-700 flex items-center gap-2"><span className="text-rose-500">⚠️</span>{error}</div>}

            <button onClick={analyze} disabled={analyzing || !text.trim()}
              className="w-full py-4 bg-amber-400 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-amber-500 hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {analyzing ? <><LoaderIcon className="w-6 h-6" />{t.home.analyzing}</> : <><CatIcon className="w-6 h-6" />{t.home.analyzeButton}</>}
            </button>
          </div>

          <div className="mt-8 bg-white rounded-3xl shadow-lg p-6 border-2 border-amber-100">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><StarIcon className="w-5 h-5 text-amber-400" />{t.home.features.title}</h3>
            <div className="space-y-3">
              {[t.home.features.item1, t.home.features.item2, t.home.features.item3, t.home.features.item4, `${t.study.vocabularyBook}: ${t.home.features.item5}`].map((item, i) => (
                <div key={i} className="flex items-start gap-3"><div className={`w-2 h-2 rounded-full mt-2 ${colorClasses[colors[i]]}`}></div><p className="text-gray-600 text-sm">{item}</p></div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-6">
              {[['sky', 'der'], ['rose', 'die'], ['emerald', 'das']].map(([c, l]) => (
                <div key={c} className="flex items-center gap-2"><span className={`w-4 h-4 rounded-full bg-${c}-400`}></span><span className="text-sm font-medium text-gray-600">{l}</span></div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <div className="flex items-end gap-2"><CatIcon className="w-10 h-10 text-amber-300" /><span className="text-gray-400 text-sm pb-2">Miau! 🐾</span></div>
          </div>
        </div>
      </main>
    </div>
  )
}
