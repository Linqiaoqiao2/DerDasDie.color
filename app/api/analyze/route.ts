import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

const openai = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY || '', baseURL: 'https://api.deepseek.com/v1' })

const buildPrompt = (text: string) => `Analyze German text. Extract all nouns and articles, return JSON.

Rules:
- EXCLUDE adjectives (Berliner, Münchner, großer, kleine, etc.)
- Include only true nouns (Substantiv)
- For nouns: original (as in text), lemma (dictionary form), gender (m/f/n/pl), plural (true/false), translation_zh, translation_en
- For articles: original, gender (based on the noun it modifies)
- Order by appearance in text

Format:
{"nouns":[{"original":"Hund","lemma":"Hund","gender":"m","plural":false,"translation_zh":"狗","translation_en":"dog"}],"articles":[{"original":"der","gender":"m"}]}

Text:
${text}`

const findPos = (word: string, text: string, used: number[]) => {
  const tl = text.toLowerCase(), wl = word.toLowerCase()
  let from = 0
  while (true) {
    const pos = tl.indexOf(wl, from)
    if (pos === -1) return -1
    if (!used.includes(pos)) return pos
    from = pos + 1
  }
}

const parse = (res: string, text: string) => {
  let clean = res.replace(/```json\n?|```\n?/g, '').trim()
  let data: any
  try { data = JSON.parse(clean) } catch { const m = clean.match(/\{[\s\S]*\}/); data = m ? JSON.parse(m[0]) : { nouns: [], articles: [] } }

  const usedN: number[] = [], usedA: number[] = []
  const nouns = (data.nouns || []).map((n: any) => { const p = findPos(n.original, text, usedN); if (p !== -1) usedN.push(p); return { ...n, position: p } }).filter((n: any) => n.position !== -1).sort((a: any, b: any) => a.position - b.position)
  const articles = (data.articles || []).map((a: any) => { const p = findPos(a.original, text, usedA); if (p !== -1) usedA.push(p); return { ...a, position: p } }).filter((a: any) => a.position !== -1).sort((a: any, b: any) => a.position - b.position)
  
  return { nouns, articles }
}

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text) return new Response(JSON.stringify({ error: '请提供文本' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const stream = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'You are a German linguistics analyzer. Return only valid JSON, no explanations.' },
      { role: 'user', content: buildPrompt(text) },
    ],
    temperature: 0.3,
    stream: true,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(ctrl) {
      let full = ''
      try {
        for await (const chunk of stream) {
          const c = chunk.choices[0]?.delta?.content || ''
          if (c) { full += c; ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ streaming: true, partial: c })}\n\n`)) }
        }
        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, ...parse(full, text) })}\n\n`))
      } catch (e: any) { ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e.message || 'Analysis failed' })}\n\n`)) }
      finally { ctrl.close() }
    }
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } })
}
