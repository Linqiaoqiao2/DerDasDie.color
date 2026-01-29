'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import ReadingMode from './components/ReadingMode'
import type { NounAnalysis, ArticleAnalysis } from './types'

export default function Home() {
  const [text, setText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [nouns, setNouns] = useState<NounAnalysis[]>([])
  const [articles, setArticles] = useState<ArticleAnalysis[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showReadingMode, setShowReadingMode] = useState(false)

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('请输入德语文本')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '分析失败')
      }

      setNouns(data.nouns || [])
      setArticles(data.articles || [])
      setShowReadingMode(true)
    } catch (err: any) {
      setError(err.message || '分析文本时出错')
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (showReadingMode) {
    return (
      <ReadingMode
        originalText={text}
        nouns={nouns}
        articles={articles}
        onBack={() => setShowReadingMode(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="text-blue-600" size={32} />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-red-500 to-green-600 bg-clip-text text-transparent">
                DerDieDas Color Reader
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              德语词性色彩映射阅读器
            </p>
            <p className="text-sm text-gray-500 mt-2">
              输入德语文本，自动识别名词并按照词性着色
            </p>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            <label
              htmlFor="text-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              输入德语文本
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="例如：Die Hunde spielen im Garten. Die Katze schläft auf dem Sofa."
              className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none text-lg"
              disabled={isAnalyzing}
            />
            <p className="text-xs text-gray-500 mt-2">
              提示：粘贴或输入一段德语文本，点击分析按钮即可查看词性着色
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !text.trim()}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>分析中...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>分析文本</span>
              </>
            )}
          </button>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">功能说明：</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 自动识别文本中的名词并标注词性</li>
              <li>• 点击着色单词查看变格表（N/G/D/A）</li>
              <li>• 点击星标收藏单词到生词本</li>
              <li>• 颜色说明：蓝色=der, 红色=die, 绿色=das</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

