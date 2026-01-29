export interface NounAnalysis {
  original: string
  lemma: string
  gender: 'm' | 'f' | 'n' | 'pl'
  plural: boolean
  position?: number
  translation_zh: string
  translation_en: string
}

export interface ArticleAnalysis {
  original: string // "der", "die", "das", "den", "dem", "des" 等
  gender: 'm' | 'f' | 'n' | 'pl'
  position?: number
}

export interface WordToken {
  text: string
  isNoun: boolean
  isArticle?: boolean
  nounData?: NounAnalysis
  articleData?: ArticleAnalysis
  index: number
}

export interface DeclensionCase {
  case: 'nominativ' | 'genitiv' | 'dativ' | 'akkusativ'
  article: string // 定冠词，如 "der", "die", "das", "des", "dem", "den"
  nounForm: string // 名词的变格形式
}

export interface DeclensionTable {
  cases: DeclensionCase[]
}

export interface FavoriteWord {
  lemma: string
  gender: 'm' | 'f' | 'n' | 'pl'
  original: string
  timestamp: number
}

