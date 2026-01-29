import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'german-dictionary.db')
const DB_DIR = path.dirname(DB_PATH)

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL') // Better performance for concurrent reads
    initializeDatabase(db)
  }
  return db
}

function initializeDatabase(database: Database.Database) {
  // Create words table
  database.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lemma TEXT NOT NULL UNIQUE,
      gender TEXT NOT NULL CHECK(gender IN ('m', 'f', 'n', 'pl')),
      translation_zh TEXT,
      translation_en TEXT,
      frequency INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_lemma ON words(lemma);
    CREATE INDEX IF NOT EXISTS idx_frequency ON words(frequency DESC);
  `)
}

export interface DictionaryWord {
  lemma: string
  gender: 'm' | 'f' | 'n' | 'pl'
  translation_zh?: string
  translation_en?: string
}

/**
 * Look up a word in the dictionary by lemma (dictionary form)
 * Returns null if not found
 */
export function lookupWord(lemma: string): DictionaryWord | null {
  const database = getDatabase()
  const stmt = database.prepare('SELECT lemma, gender, translation_zh, translation_en FROM words WHERE lemma = ? COLLATE NOCASE')
  const result = stmt.get(lemma.toLowerCase()) as any
  
  if (!result) {
    return null
  }
  
  return {
    lemma: result.lemma,
    gender: result.gender,
    translation_zh: result.translation_zh || undefined,
    translation_en: result.translation_en || undefined,
  }
}

/**
 * Look up multiple words at once (batch lookup)
 */
export function lookupWords(lemmas: string[]): Map<string, DictionaryWord> {
  const database = getDatabase()
  const results = new Map<string, DictionaryWord>()
  
  if (lemmas.length === 0) {
    return results
  }
  
  // Use IN clause for batch lookup
  const placeholders = lemmas.map(() => '?').join(',')
  const stmt = database.prepare(
    `SELECT lemma, gender, translation_zh, translation_en 
     FROM words 
     WHERE lemma IN (${placeholders}) COLLATE NOCASE`
  )
  
  const found = stmt.all(...lemmas.map(l => l.toLowerCase())) as any[]
  
  for (const row of found) {
    results.set(row.lemma.toLowerCase(), {
      lemma: row.lemma,
      gender: row.gender,
      translation_zh: row.translation_zh || undefined,
      translation_en: row.translation_en || undefined,
    })
  }
  
  return results
}

/**
 * Insert or update a word in the dictionary
 */
export function upsertWord(word: DictionaryWord): void {
  const database = getDatabase()
  const stmt = database.prepare(`
    INSERT INTO words (lemma, gender, translation_zh, translation_en, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(lemma) DO UPDATE SET
      gender = excluded.gender,
      translation_zh = excluded.translation_zh,
      translation_en = excluded.translation_en,
      updated_at = CURRENT_TIMESTAMP
  `)
  
  stmt.run(
    word.lemma.toLowerCase(),
    word.gender,
    word.translation_zh || null,
    word.translation_en || null
  )
}

/**
 * Import words from JSON file
 * Expected format: { "word": { "gender": "m", "translation_zh": "...", "translation_en": "..." }, ... }
 * or array format: [{ "lemma": "...", "gender": "m", ... }, ...]
 */
export function importFromJSON(jsonData: any): number {
  const database = getDatabase()
  const transaction = database.transaction(() => {
    let count = 0
    
    if (Array.isArray(jsonData)) {
      // Array format
      for (const item of jsonData) {
        if (item.lemma && item.gender) {
          upsertWord({
            lemma: item.lemma,
            gender: item.gender,
            translation_zh: item.translation_zh,
            translation_en: item.translation_en,
          })
          count++
        }
      }
    } else if (typeof jsonData === 'object') {
      // Object format: { "word": { ... } }
      for (const [lemma, data] of Object.entries(jsonData)) {
        if (data && typeof data === 'object' && 'gender' in data) {
          upsertWord({
            lemma,
            gender: (data as any).gender,
            translation_zh: (data as any).translation_zh,
            translation_en: (data as any).translation_en,
          })
          count++
        }
      }
    }
    
    return count
  })
  
  return transaction()
}

/**
 * Get statistics about the dictionary
 */
export function getDictionaryStats(): { totalWords: number; byGender: Record<string, number> } {
  const database = getDatabase()
  const totalStmt = database.prepare('SELECT COUNT(*) as count FROM words')
  const genderStmt = database.prepare('SELECT gender, COUNT(*) as count FROM words GROUP BY gender')
  
  const total = (totalStmt.get() as any).count
  const genderCounts: Record<string, number> = {}
  
  for (const row of genderStmt.all() as any[]) {
    genderCounts[row.gender] = row.count
  }
  
  return { totalWords: total, byGender: genderCounts }
}

