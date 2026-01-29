#!/usr/bin/env node

/**
 * Dictionary Import Script
 * 
 * Usage:
 *   npm run import-dict <json-file>
 * 
 * Supports multiple JSON formats:
 * 1. Array format: [{ "lemma": "Hund", "gender": "m", "translation_zh": "狗", "translation_en": "dog" }, ...]
 * 2. Object format: { "Hund": { "gender": "m", "translation_zh": "狗", "translation_en": "dog" }, ... }
 * 3. Skywind-Dict format: { "word": { "translation": "翻译", "gender": "m" }, ... }
 * 4. Hathibelagal format: { "word": { "en": "translation", "gender": "m" }, ... }
 */

import { importFromJSON, getDictionaryStats } from '../app/lib/dictionary'
import fs from 'fs'
import path from 'path'

const jsonFile = process.argv[2]

if (!jsonFile) {
  console.error('Usage: npm run import-dict <json-file>')
  console.error('Example: npm run import-dict data/skywind-dict.json')
  process.exit(1)
}

const filePath = path.resolve(jsonFile)

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`)
  process.exit(1)
}

console.log(`Reading dictionary file: ${filePath}`)

try {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const jsonData = JSON.parse(fileContent)
  
  console.log('Importing words...')
  const count = importFromJSON(jsonData)
  
  console.log(`✅ Successfully imported ${count} words`)
  
  const stats = getDictionaryStats()
  console.log('\nDictionary Statistics:')
  console.log(`  Total words: ${stats.totalWords}`)
  console.log(`  By gender:`)
  console.log(`    Masculine (m): ${stats.byGender.m || 0}`)
  console.log(`    Feminine (f): ${stats.byGender.f || 0}`)
  console.log(`    Neuter (n): ${stats.byGender.n || 0}`)
  console.log(`    Plural (pl): ${stats.byGender.pl || 0}`)
  
} catch (error: any) {
  console.error('Error importing dictionary:', error.message)
  process.exit(1)
}

