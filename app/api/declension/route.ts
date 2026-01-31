import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY || '', baseURL: 'https://api.deepseek.com/v1' })

export async function POST(req: NextRequest) {
  const { lemma, gender, original, plural } = await req.json()
  if (!lemma || !gender) return NextResponse.json({ error: '需要提供 lemma 和 gender' }, { status: 400 })

  const genderNames: Record<string, string> = { m: 'Maskulin (der)', f: 'Feminin (die)', n: 'Neutrum (das)', pl: 'Plural (die)' }
  const genderName = genderNames[gender] || ''

  const prompt = `Generate German noun declension table.

Noun: ${lemma} (${genderName}), Original: ${original || lemma}, Plural: ${plural ? 'Yes' : 'No'}

Rules:
- Definite Articles: Masc Nom=der/Gen=des/Dat=dem/Akk=den, Fem Nom=die/Gen=der/Dat=der/Akk=die, Neut Nom=das/Gen=des/Dat=dem/Akk=das, Pl Nom=die/Gen=der/Dat=den/Akk=die
- Feminine nouns: Never add -s in Genitive. Masc/Neut Genitive: Add -s or -es. N-declension masculine nouns get -en. Dative plural: Add -n if not ending in -n/-s.

Return JSON only:
{"cases":[{"case":"nominativ","article":"...","nounForm":"..."},{"case":"genitiv","article":"...","nounForm":"..."},{"case":"dativ","article":"...","nounForm":"..."},{"case":"akkusativ","article":"...","nounForm":"..."}]}`

  const res = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'You are a German declension generator. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  })

  let clean = (res.choices[0]?.message?.content || '{}').replace(/```json\n?|```\n?/g, '')
  const table = JSON.parse(clean)
  
  if (!table.cases?.length) return NextResponse.json({ error: '无效的变格表' }, { status: 500 })
  
  // Fix feminine genitive
  if (gender === 'f') {
    const gen = table.cases.find((c: any) => c.case === 'genitiv')
    if (gen?.nounForm?.endsWith('s')) gen.nounForm = gen.nounForm.slice(0, -1)
  }

  return NextResponse.json(table)
}
