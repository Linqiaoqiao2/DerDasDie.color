const genderLabels: Record<string, string> = { m: 'der', f: 'die', n: 'das', pl: 'die (Pl.)' }

export function exportToCSV(words: any[]) {
  if (!words.length) return

  const escape = (s: string) => {
    const e = s.replace(/"/g, '""')
    return /[,\n"]/.test(e) ? `"${e}"` : e
  }

  const rows = words.map(w => 
    [genderLabels[w.gender], w.lemma, w.gender, w.translation_zh || '', w.translation_en || '', w.original]
      .map(escape).join(',')
  )

  const csv = '\uFEFF' + ['Article,Word,Gender,Chinese,English,Original', ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'vocabulary.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}
