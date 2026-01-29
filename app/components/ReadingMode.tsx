'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X } from 'lucide-react'
import type { NounAnalysis, ArticleAnalysis, WordToken, DeclensionTable, FavoriteWord } from '../types'

interface ReadingModeProps {
  originalText: string
  nouns: NounAnalysis[]
  articles: ArticleAnalysis[]
  onBack: () => void
}

const genderColors = {
  m: 'text-blue-600 hover:text-blue-700',
  f: 'text-red-500 hover:text-red-600',
  n: 'text-green-600 hover:text-green-700',
}

const genderLabels = {
  m: 'der',
  f: 'die',
  n: 'das',
}

export default function ReadingMode({ originalText, nouns, articles, onBack }: ReadingModeProps) {
  const [selectedNoun, setSelectedNoun] = useState<NounAnalysis | null>(null)
  const [declensionTable, setDeclensionTable] = useState<DeclensionTable | null>(null)
  const [favorites, setFavorites] = useState<FavoriteWord[]>([])
  const [isLoadingDeclension, setIsLoadingDeclension] = useState(false)

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('derdiedas-favorites')
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load favorites:', e)
      }
    }
  }, [])

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: FavoriteWord[]) => {
    setFavorites(newFavorites)
    localStorage.setItem('derdiedas-favorites', JSON.stringify(newFavorites))
  }

  // Check if word is favorited
  const isFavorited = (lemma: string) => {
    return favorites.some((fav) => fav.lemma === lemma)
  }

  // Toggle favorite
  const toggleFavorite = (noun: NounAnalysis) => {
    const newFavorites = [...favorites]
    const existingIndex = newFavorites.findIndex((fav) => fav.lemma === noun.lemma)

    if (existingIndex >= 0) {
      newFavorites.splice(existingIndex, 1)
    } else {
      newFavorites.push({
        lemma: noun.lemma,
        gender: noun.gender,
        original: noun.original,
        timestamp: Date.now(),
      })
    }

    saveFavorites(newFavorites)
  }

  // Check if word is an adjective (like city names + -er)
  const isAdjective = (noun: NounAnalysis): boolean => {
    const lemma = noun.lemma.toLowerCase()
    const original = noun.original.toLowerCase()
    
    // Check for city name + -er pattern (e.g., Berliner, Münchner, Hamburger)
    // These are typically adjectives derived from city names
    const cityAdjectivePattern = /^(berlin|münchen|hamburg|köln|frankfurt|stuttgart|düsseldorf|dortmund|essen|leipzig|bremen|dresden|hannover|nürnberg|duisburg|bochum|wuppertal|bielefeld|bonn|münster|karlsruhe|mannheim|augsburg|wiesbaden|gelsenkirchen|mönchengladbach|braunschweig|chemnitz|kiel|aachen|halle|magdeburg|freiburg|krefeld|lübeck|oberhausen|erfurt|mainz|rostock|kassel|hagen|hamm|saarbrücken|mülheim|potsdam|ludwigshafen|oldenburg|leverkusen|osnabrück|solingen|heidelberg|herne|neuss|darmstadt|paderborn|regensburg|ingolstadt|würzburg|fürth|wolfsburg|offenbach|ulm|heilbronn|pforzheim|göttingen|bottrop|trier|recklinghausen|reutlingen|bremerhaven|koblenz|bergisch|gladbach|remscheid|jena|erlangen|moers|siegen|hildesheim|salzgitter)er$/i
    
    if (cityAdjectivePattern.test(lemma) || cityAdjectivePattern.test(original)) {
      return true
    }
    
    return false
  }

  // Fetch declension table from API
  const fetchDeclension = async (noun: NounAnalysis) => {
    setIsLoadingDeclension(true)
    try {
      const response = await fetch('/api/declension', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lemma: noun.lemma,
          gender: noun.gender,
          original: noun.original,
          plural: noun.plural,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch declension')
      }

      setDeclensionTable(data)
    } catch (error) {
      console.error('Failed to fetch declension:', error)
      setDeclensionTable(null)
    } finally {
      setIsLoadingDeclension(false)
    }
  }

  // Handle noun click
  const handleNounClick = (noun: NounAnalysis) => {
    // Skip plural nouns (pl)
    if (noun.gender === 'pl') {
      return
    }
    
    // Check if it's an adjective
    if (isAdjective(noun)) {
      // Show a message that it's an adjective, not a noun
      alert(`"${noun.original}" 是一个形容词（Adjektiv），不是名词。\n\n例如："Berliner" 是 "来自柏林的" 的意思，是形容词形式。\n\n真正的名词是它后面修饰的那个词。`)
      return
    }
    
    setSelectedNoun(noun)
    fetchDeclension(noun)
  }

  // Parse text into tokens
  const parseText = (): WordToken[] => {
    const tokens: WordToken[] = []
    const text = originalText

    // Create sorted arrays with positions
    const sortedNouns = nouns
      .filter((noun) => noun.position !== undefined)
      .sort((a, b) => (a.position || 0) - (b.position || 0))

    const sortedArticles = articles
      .filter((article) => article.position !== undefined)
      .sort((a, b) => (a.position || 0) - (b.position || 0))

    // Track which items have been used
    const usedNouns = new Set<number>()
    const usedArticles = new Set<number>()

    // Build maps for quick lookup
    const nounMap = new Map<number, { noun: NounAnalysis; index: number }>()
    sortedNouns.forEach((noun, idx) => {
      if (noun.position !== undefined) {
        nounMap.set(noun.position, { noun, index: idx })
      }
    })

    const articleMap = new Map<number, { article: ArticleAnalysis; index: number }>()
    sortedArticles.forEach((article, idx) => {
      if (article.position !== undefined) {
        articleMap.set(article.position, { article, index: idx })
      }
    })

    // Split text into words while preserving spaces and punctuation
    const wordRegex = /(\S+|\s+)/g
    let match

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0]
      const wordStart = match.index
      const wordEnd = wordStart + word.length

      // Skip whitespace-only tokens
      if (!word.trim()) {
        tokens.push({
          text: word,
          isNoun: false,
          index: wordStart,
        })
        continue
      }

      // Clean word for matching (remove punctuation)
      const cleanWord = word.replace(/[.,!?;:()\[\]{}'"]/g, '')
      const cleanWordLower = cleanWord.toLowerCase()

      // Try to match article first (articles usually come before nouns)
      let matchedArticle: ArticleAnalysis | undefined
      let matchedArticleIndex = -1

      // Check for article at this position
      for (let pos = wordStart; pos < wordEnd; pos++) {
        const articleEntry = articleMap.get(pos)
        if (articleEntry && !usedArticles.has(articleEntry.index)) {
          const article = articleEntry.article
          const articleLower = article.original.toLowerCase().trim()
          
          if (cleanWordLower === articleLower) {
            matchedArticle = article
            matchedArticleIndex = articleEntry.index
            break
          }
        }
      }

      // If no exact position match for article, try overlap
      if (!matchedArticle) {
        for (let i = 0; i < sortedArticles.length; i++) {
          if (usedArticles.has(i)) continue
          
          const article = sortedArticles[i]
          const articleLower = article.original.toLowerCase().trim()
          const articleStart = article.position || 0
          const articleEnd = articleStart + article.original.length

          const overlaps = (wordStart < articleEnd && wordEnd > articleStart)
          
          if (overlaps && cleanWordLower === articleLower) {
            matchedArticle = article
            matchedArticleIndex = i
            break
          }
        }
      }

      // Try to match noun
      let matchedNoun: NounAnalysis | undefined
      let matchedNounIndex = -1

      // First, try exact position match
      for (let pos = wordStart; pos < wordEnd; pos++) {
        const nounEntry = nounMap.get(pos)
        if (nounEntry && !usedNouns.has(nounEntry.index)) {
          const noun = nounEntry.noun
          const nounLower = noun.original.toLowerCase().trim()
          
          if (cleanWordLower === nounLower) {
            matchedNoun = noun
            matchedNounIndex = nounEntry.index
            break
          }
        }
      }

      // If no exact match, try position-based overlap
      if (!matchedNoun) {
        for (let i = 0; i < sortedNouns.length; i++) {
          if (usedNouns.has(i)) continue
          
          const noun = sortedNouns[i]
          const nounLower = noun.original.toLowerCase().trim()
          const nounStart = noun.position || 0
          const nounEnd = nounStart + noun.original.length

          const overlaps = (wordStart < nounEnd && wordEnd > nounStart)
          
          if (overlaps) {
            if (cleanWordLower === nounLower) {
              matchedNoun = noun
              matchedNounIndex = i
              break
            }
            if (cleanWordLower.startsWith(nounLower) || nounLower.startsWith(cleanWordLower)) {
              matchedNoun = noun
              matchedNounIndex = i
              break
            }
          }
        }
      }

      // Create token - prioritize noun over article if both match
      if (matchedNoun && matchedNounIndex >= 0) {
        tokens.push({
          text: word,
          isNoun: true,
          nounData: matchedNoun,
          index: wordStart,
        })
        usedNouns.add(matchedNounIndex)
      } else if (matchedArticle && matchedArticleIndex >= 0) {
        tokens.push({
          text: word,
          isNoun: false,
          isArticle: true,
          articleData: matchedArticle,
          index: wordStart,
        })
        usedArticles.add(matchedArticleIndex)
      } else {
        tokens.push({
          text: word,
          isNoun: false,
          index: wordStart,
        })
      }
    }

    return tokens
  }

  const tokens = parseText()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          ← 返回编辑
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">阅读模式</h2>

          {/* Color Legend */}
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm font-semibold mb-2">词性颜色说明：</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-blue-600 font-medium">der (Maskulin)</span>
              <span className="text-red-500 font-medium">die (Feminin)</span>
              <span className="text-green-600 font-medium">das (Neutrum)</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-xs text-gray-600">
                已识别 {nouns.length} 个名词，{articles.length} 个冠词 | 
                已标注 {tokens.filter(t => t.isNoun).length} 个名词，{tokens.filter(t => t.isArticle).length} 个冠词
              </p>
            </div>
          </div>

          {/* Text Display */}
          <div className="text-lg leading-relaxed mb-8">
            {tokens.map((token, idx) => {
              if (token.isNoun && token.nounData) {
                const noun = token.nounData
                // Skip plural nouns (pl)
                if (noun.gender === 'pl') {
                  return <span key={idx}>{token.text}</span>
                }
                return (
                  <motion.span
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`inline-block cursor-pointer font-semibold ${genderColors[noun.gender]}`}
                    onClick={() => handleNounClick(noun)}
                    title={`${genderLabels[noun.gender]} ${noun.lemma}`}
                  >
                    {token.text}
                  </motion.span>
                )
              }
              if (token.isArticle && token.articleData) {
                const article = token.articleData
                // Skip plural articles (pl)
                if (article.gender === 'pl') {
                  return <span key={idx}>{token.text}</span>
                }
                return (
                  <motion.span
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    className={`inline-block font-semibold ${genderColors[article.gender]}`}
                    title={`冠词 (${genderLabels[article.gender]})`}
                  >
                    {token.text}
                  </motion.span>
                )
              }
              return <span key={idx}>{token.text}</span>
            })}
          </div>

          {/* Declension Popover */}
          <AnimatePresence>
            {selectedNoun && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => {
                  setSelectedNoun(null)
                  setDeclensionTable(null)
                }}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {selectedNoun.gender !== 'pl' && (
                          <span className={genderColors[selectedNoun.gender]}>
                            {genderLabels[selectedNoun.gender]}
                          </span>
                        )}
                        {selectedNoun.gender === 'pl' && <span>die</span>}{' '}
                        {selectedNoun.lemma}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        原文: {selectedNoun.original}
                      </p>
                      {selectedNoun.translation_zh && (
                        <p className="text-sm text-gray-600 mt-1">
                          中文：{selectedNoun.translation_zh}
                        </p>
                      )}
                      {selectedNoun.translation_en && (
                        <p className="text-sm text-gray-600 mt-1">
                          英文：{selectedNoun.translation_en}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleFavorite(selectedNoun)}
                        className={`p-2 rounded-lg transition-colors ${
                          isFavorited(selectedNoun.lemma)
                            ? 'text-yellow-500 bg-yellow-50'
                            : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
                        }`}
                        title="收藏"
                      >
                        <Star
                          size={20}
                          fill={isFavorited(selectedNoun.lemma) ? 'currentColor' : 'none'}
                        />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedNoun(null)
                          setDeclensionTable(null)
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  {isLoadingDeclension ? (
                    <div className="py-8 text-center text-gray-500">加载中...</div>
                  ) : declensionTable && declensionTable.cases ? (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-4">变格表 (Deklination)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-gray-200">
                              <th className="text-left py-2 px-3 font-semibold text-gray-700">格</th>
                              <th className="text-left py-2 px-3 font-semibold text-gray-700">定冠词</th>
                              <th className="text-left py-2 px-3 font-semibold text-gray-700">名词形式</th>
                            </tr>
                          </thead>
                          <tbody>
                            {declensionTable.cases.map((caseData, idx) => {
                              const caseNames: Record<string, string> = {
                                nominativ: 'Nominativ',
                                genitiv: 'Genitiv',
                                dativ: 'Dativ',
                                akkusativ: 'Akkusativ',
                              }
                              return (
                                <tr
                                  key={caseData.case}
                                  className={idx < declensionTable.cases.length - 1 ? 'border-b border-gray-100' : ''}
                                >
                                  <td className="py-3 px-3 font-medium text-gray-600">
                                    {caseNames[caseData.case] || caseData.case}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span
                                      className={`font-bold text-lg ${selectedNoun.gender !== 'pl' ? genderColors[selectedNoun.gender] : 'text-gray-600'}`}
                                    >
                                      {caseData.article}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 font-semibold text-gray-800">
                                    {caseData.nounForm}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : selectedNoun && !isLoadingDeclension ? (
                    <div className="border-t pt-4 text-center text-gray-500">
                      无法加载变格表
                    </div>
                  ) : null}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

