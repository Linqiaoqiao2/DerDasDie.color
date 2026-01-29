import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { NounAnalysis, ArticleAnalysis } from '../../types'

// Dynamic import for better-sqlite3 to avoid build-time issues
let dictionaryModule: typeof import('../../lib/dictionary') | null = null

async function getDictionary() {
  if (!dictionaryModule) {
    dictionaryModule = await import('../../lib/dictionary')
  }
  return dictionaryModule
}

// Ensure this route uses Node.js runtime (not Edge)
export const runtime = 'nodejs'

// Initialize OpenAI client (compatible with DeepSeek API)
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com/v1',
})

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const prompt = `你是一名德语语言学专家。请分析以下德语文本，提取所有名词（Noun）和冠词（Article），并返回JSON对象。

重要规则：
1. **排除形容词**：不要将形容词识别为名词，特别是：
   - 城市名+-er 形式的形容词（如 "Berliner", "Münchner", "Hamburger" 等）
   - 其他形容词形式（如 "großer", "kleine", "neues" 等）
   - 这些词虽然可能大写，但它们是形容词，不是名词

2. **识别名词**：
   - 只识别真正的名词（Noun/Substantiv）
   - 包括所有变格形式
   - 返回每个名词的：
     * original: 文本中的原始形式（保持大小写）
     * lemma: 名词的原型（字典形式）
     * gender: 词性（m=Maskulin/der, f=Feminin/die, n=Neutrum/das, pl=Plural）
     * plural: 是否为复数形式（true/false）
     * translation_zh: 该单词原型（lemma）的中文准确翻译
     * translation_en: 该单词原型（lemma）的英文准确翻译

3. **识别冠词**：
   - 识别所有定冠词和指示代词（der, die, das, den, dem, des, dieser, diese, dieses 等）
   - 返回每个冠词的：
     * original: 文本中的原始形式
     * gender: 根据它修饰的名词确定词性（m/f/n/pl）
   - 冠词的词性必须与它修饰的名词一致

4. **关联规则**：
   - 冠词通常紧邻其修饰的名词（可能在形容词之前）
   - 例如："der Berliner Nachkriegsgeschichte" 中：
     * "der" 是冠词，修饰 "Nachkriegsgeschichte"（阴性），所以 gender 应该是 "f"
     * "Berliner" 是形容词，不要识别
     * "Nachkriegsgeschichte" 是名词（阴性），gender 是 "f"

5. **顺序**：按照在原文中出现的顺序排列

返回格式（JSON对象）：
{
  "nouns": [
    {
      "original": "Hunde",
      "lemma": "Hund",
      "gender": "m",
      "plural": true,
      "translation_zh": "狗",
      "translation_en": "dog"
    },
    {
      "original": "Katze",
      "lemma": "Katze",
      "gender": "f",
      "plural": false,
      "translation_zh": "猫",
      "translation_en": "cat"
    },
    {
      "original": "Nachkriegsgeschichte",
      "lemma": "Nachkriegsgeschichte",
      "gender": "f",
      "plural": false,
      "translation_zh": "战后历史",
      "translation_en": "post-war history"
    }
  ],
  "articles": [
    {
      "original": "der",
      "gender": "f"
    },
    {
      "original": "die",
      "gender": "f"
    }
  ]
}

如果文本中没有名词或冠词，返回空数组。

文本：
${text}

请直接返回JSON对象：`

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的德语语言学分析工具。只返回有效的JSON数组，不要添加任何解释或markdown格式。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || '[]'
    
    // Clean the response (remove markdown code blocks if present)
    let cleanedResponse = responseText
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '')
    }

    let parsedData: { nouns?: NounAnalysis[]; articles?: ArticleAnalysis[] } = {}
    try {
      parsedData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response text:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: responseText },
        { status: 500 }
      )
    }

    // Handle both old format (array) and new format (object)
    let nouns: NounAnalysis[] = []
    let articles: ArticleAnalysis[] = []

    if (Array.isArray(parsedData)) {
      // Old format: just array of nouns
      nouns = parsedData
    } else {
      // New format: object with nouns and articles
      nouns = parsedData.nouns || []
      articles = parsedData.articles || []
    }

    // Hybrid lookup: Check local dictionary first, then use AI results
    // This significantly speeds up analysis for common words
    let enhancedNouns: NounAnalysis[] = nouns
    
    try {
      const dict = await getDictionary()
      const lemmas = nouns.map(n => n.lemma?.toLowerCase()).filter(Boolean) as string[]
      const dictionaryResults = dict.lookupWords(lemmas)
      
      // Enhance nouns with dictionary data and cache new words
      enhancedNouns = []
      for (const noun of nouns) {
        if (!noun.lemma) {
          continue
        }
        
        const dictWord = dictionaryResults.get(noun.lemma.toLowerCase())
        
        if (dictWord) {
          // Use dictionary data (fast, <5ms)
          enhancedNouns.push({
            ...noun,
            gender: dictWord.gender || noun.gender,
            translation_zh: dictWord.translation_zh || noun.translation_zh,
            translation_en: dictWord.translation_en || noun.translation_en,
          })
        } else {
          // Use AI result, and optionally cache it for future use
          enhancedNouns.push(noun)
          
          // Cache the AI result in dictionary (async, non-blocking)
          if (noun.lemma && noun.gender) {
            try {
              dict.upsertWord({
                lemma: noun.lemma,
                gender: noun.gender,
                translation_zh: noun.translation_zh,
                translation_en: noun.translation_en,
              })
            } catch (error) {
              // Silently fail if dictionary write fails (non-critical)
              console.warn('Failed to cache word in dictionary:', error)
            }
          }
        }
      }
    } catch (error) {
      // If dictionary is not available, fall back to AI results only
      console.warn('Dictionary not available, using AI results only:', error)
      enhancedNouns = nouns
    }
    
    nouns = enhancedNouns

    // Validate and add positions
    const validatedNouns: NounAnalysis[] = []
    const textLower = text.toLowerCase()
    const usedRanges: Array<{ start: number; end: number }> = []

    for (const noun of nouns) {
      if (!noun.original || !noun.lemma || !noun.gender) {
        continue
      }

      // Find position in original text (case-insensitive)
      const nounLower = noun.original.toLowerCase().trim()
      const nounLength = noun.original.length
      let position = -1
      let searchIndex = 0

      // Try to find the noun, avoiding already used positions
      while (true) {
        const foundPos = textLower.indexOf(nounLower, searchIndex)
        if (foundPos === -1) break

        // Check if this position overlaps with any used range
        let isUsed = false
        for (const range of usedRanges) {
          if (foundPos < range.end && foundPos + nounLength > range.start) {
            isUsed = true
            break
          }
        }

        if (!isUsed) {
          position = foundPos
          usedRanges.push({ start: foundPos, end: foundPos + nounLength })
          break
        }

        searchIndex = foundPos + 1
      }

      // If still not found, try fuzzy matching (remove punctuation)
      if (position === -1) {
        const cleanNoun = nounLower.replace(/[.,!?;:()\[\]{}'"]/g, '')
        searchIndex = 0
        
        while (true) {
          // Try to find word boundaries
          const regex = new RegExp(`\\b${cleanNoun.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
          const match = regex.exec(textLower.substring(searchIndex))
          
          if (!match) break
          
          const foundPos = searchIndex + match.index
          
          // Check if this position overlaps with any used range
          let isUsed = false
          for (const range of usedRanges) {
            if (foundPos < range.end && foundPos + cleanNoun.length > range.start) {
              isUsed = true
              break
            }
          }

          if (!isUsed) {
            position = foundPos
            usedRanges.push({ start: foundPos, end: foundPos + cleanNoun.length })
            break
          }

          searchIndex = foundPos + 1
        }
      }

      if (position !== -1) {
        validatedNouns.push({
          ...noun,
          position,
        })
      } else {
        // Log nouns that couldn't be found (for debugging)
        console.warn(`Could not find position for noun: ${noun.original} (${noun.lemma}, ${noun.gender})`)
      }
    }

    // Sort by position to maintain order
    validatedNouns.sort((a, b) => (a.position || 0) - (b.position || 0))

    // Process articles
    const validatedArticles: ArticleAnalysis[] = []
    const articleUsedRanges: Array<{ start: number; end: number }> = []

    // Common German articles
    const articlePatterns = [
      'der', 'die', 'das', 'den', 'dem', 'des',
      'dieser', 'diese', 'dieses', 'diesen', 'diesem',
      'jener', 'jene', 'jenes', 'jenen', 'jenem',
      'welcher', 'welche', 'welches', 'welchen', 'welchem'
    ]

    for (const article of articles) {
      if (!article.original || !article.gender) {
        continue
      }

      const articleLower = article.original.toLowerCase().trim()
      const articleLength = article.original.length
      let position = -1
      let searchIndex = 0

      // Try to find the article in text
      while (true) {
        const foundPos = textLower.indexOf(articleLower, searchIndex)
        if (foundPos === -1) break

        // Check if this position overlaps with any used range
        let isUsed = false
        for (const range of articleUsedRanges) {
          if (foundPos < range.end && foundPos + articleLength > range.start) {
            isUsed = true
            break
          }
        }

        // Also check against noun ranges to avoid conflicts
        for (const range of usedRanges) {
          if (foundPos < range.end && foundPos + articleLength > range.start) {
            isUsed = true
            break
          }
        }

        if (!isUsed) {
          position = foundPos
          articleUsedRanges.push({ start: foundPos, end: foundPos + articleLength })
          break
        }

        searchIndex = foundPos + 1
      }

      if (position !== -1) {
        validatedArticles.push({
          ...article,
          position,
        })
      }
    }

    // Sort articles by position
    validatedArticles.sort((a, b) => (a.position || 0) - (b.position || 0))

    // Log summary for debugging
    console.log(`Found ${validatedNouns.length} out of ${nouns.length} nouns`)
    console.log(`Found ${validatedArticles.length} out of ${articles.length} articles`)
    const genderCount = validatedNouns.reduce((acc, n) => {
      acc[n.gender] = (acc[n.gender] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log('Noun gender distribution:', genderCount)
    const articleGenderCount = validatedArticles.reduce((acc, a) => {
      acc[a.gender] = (acc[a.gender] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log('Article gender distribution:', articleGenderCount)

    return NextResponse.json({ 
      nouns: validatedNouns,
      articles: validatedArticles 
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze text', details: error.message },
      { status: 500 }
    )
  }
}

