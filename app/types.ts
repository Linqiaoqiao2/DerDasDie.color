export interface NounAnalysis {
  original: string
  lemma: string
  gender: 'm' | 'f' | 'n' | 'pl'
  position: number
  translation_zh: string
  translation_en: string
}

export interface ArticleAnalysis {
  original: string
  gender: 'm' | 'f' | 'n' | 'pl'
  position: number
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
  article: string
  nounForm: string
}

export interface DeclensionTable {
  cases: DeclensionCase[]
}

export interface FavoriteWord {
  lemma: string
  gender: 'm' | 'f' | 'n' | 'pl'
  original: string
  timestamp: number
  translation_zh?: string
  translation_en?: string
}
