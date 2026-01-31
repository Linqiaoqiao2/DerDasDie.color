import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

const openai = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY || '', baseURL: 'https://api.deepseek.com/v1' })

const PROMPT = `Analyze German text. Extract nouns and articles as JSON.
Rules: Exclude adjectives, include only true nouns (Substantiv).
Nouns: original, lemma, gender (m/f/n/pl), plural, translation_zh, translation_en
Articles: original, gender (based on noun it modifies)
Format: {"nouns":[...],"articles":[...]}`

const findPos = (word: string, text: string, used: number[]) => {
  const tl = text.toLowerCase(), wl = word.toLowerCase()
  let from = 0
  while (true) {
    const pos = tl.indexOf(wl, from)
    if (pos === -1 || !used.includes(pos)) return pos === -1 ? -1 : (used.push(pos), pos)
    from = pos + 1
  }
}

const parse = (res: string, text: string) => {
  const clean = res.replace(/```json\n?|```\n?/g, '').trim()
  const data = (() => { try { return JSON.parse(clean) } catch { const m = clean.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { nouns: [], articles: [] } } })()
  const usedN: number[] = [], usedA: number[] = []
  const process = (items: any[], used: number[]) => items.map((x: any) => ({ ...x, position: findPos(x.original, text, used) })).filter((x: any) => x.position !== -1).sort((a: any, b: any) => a.position - b.position)
  return { nouns: process(data.nouns || [], usedN), articles: process(data.articles || [], usedA) }
}

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return new Response(JSON.stringify({ error: 'Text required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const stream = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'German linguistics analyzer. Return only valid JSON.' },
      { role: 'user', content: `${PROMPT}\n\nText:\n${text}` },
    ],
    temperature: 0.3,
    stream: true,
  })

  const enc = new TextEncoder()
  const send = (data: object) => enc.encode(`data: ${JSON.stringify(data)}\n\n`)

  return new Response(new ReadableStream({
    async start(ctrl) {
      let full = ''
      try {
        for await (const chunk of stream) {
          const c = chunk.choices[0]?.delta?.content || ''
          if (c) { full += c; ctrl.enqueue(send({ streaming: true, partial: c })) }
        }
        ctrl.enqueue(send({ done: true, ...parse(full, text) }))
      } catch (e: any) { ctrl.enqueue(send({ error: e.message || 'Analysis failed' })) }
      finally { ctrl.close() }
    }
  }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } })
}
