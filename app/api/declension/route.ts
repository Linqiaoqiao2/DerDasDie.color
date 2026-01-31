import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY || '', baseURL: 'https://api.deepseek.com/v1' })

const GENDER_NAMES: Record<string, string> = { m: 'Maskulin (der)', f: 'Feminin (die)', n: 'Neutrum (das)', pl: 'Plural (die)' }

export async function POST(req: NextRequest) {
  const { lemma, gender, original, plural } = await req.json()
  if (!lemma || !gender) return NextResponse.json({ error: 'lemma and gender required' }, { status: 400 })

  const prompt = `German noun declension for: ${lemma} (${GENDER_NAMES[gender] || ''})
Return JSON: {"cases":[{"case":"nominativ/genitiv/dativ/akkusativ","article":"...","nounForm":"..."}]}`

  const res = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'German declension generator. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  })

  const clean = (res.choices[0]?.message?.content || '{}').replace(/```json\n?|```\n?/g, '')
  const table = JSON.parse(clean)
  if (!table.cases?.length) return NextResponse.json({ error: 'Invalid declension' }, { status: 500 })
  
  // Fix feminine genitive (AI sometimes incorrectly adds -s)
  if (gender === 'f') {
    const gen = table.cases.find((c: any) => c.case === 'genitiv')
    if (gen?.nounForm?.endsWith('s')) gen.nounForm = gen.nounForm.slice(0, -1)
  }

  return NextResponse.json(table)
}
