import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { DeclensionTable, DeclensionCase } from '@/app/types'

// Initialize OpenAI client (compatible with DeepSeek API)
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com/v1',
})

export async function POST(request: NextRequest) {
  try {
    const { lemma, gender, original, plural } = await request.json()

    if (!lemma || !gender) {
      return NextResponse.json(
        { error: 'Lemma and gender are required' },
        { status: 400 }
      )
    }

    const prompt = `你是一名德语语言学专家。请为以下德语名词生成完整的变格表（Deklination）。

名词信息：
- 原型 (Lemma): ${lemma}
- 原文形式: ${original || lemma}
- 词性: ${gender === 'm' ? 'Maskulin (der)' : gender === 'f' ? 'Feminin (die)' : gender === 'n' ? 'Neutrum (das)' : 'Plural (die)'}
- 是否复数: ${plural ? '是' : '否'}

**重要规则：**

1. **四个格的定冠词（Bestimmter Artikel）：**
   - Maskulin (der): Nominativ=der, Genitiv=des, Dativ=dem, Akkusativ=den
   - Feminin (die): Nominativ=die, Genitiv=der, Dativ=der, Akkusativ=die
   - Neutrum (das): Nominativ=das, Genitiv=des, Dativ=dem, Akkusativ=das
   - Plural (die): Nominativ=die, Genitiv=der, Dativ=den, Akkusativ=die

2. **名词变格规则（严格遵守）：**
   - **阴性名词 (Feminin) 第二格 (Genitiv)：绝对不能加 '-s' 或任何词尾！**
   - **阳性名词 (Maskulin) 第二格：**
     * 大多数加 '-s'（如：der Hund → des Hundes）
     * 以 -s, -ß, -x, -z 结尾的加 '-es'（如：der Bus → des Busses）
   - **中性名词 (Neutrum) 第二格：**
     * 大多数加 '-s'（如：das Kind → des Kindes）
     * 以 -s, -ß, -x, -z 结尾的加 '-es'（如：das Haus → des Hauses）
   - **复数形式：** 四个格通常形式相同，但定冠词不同

3. **返回格式（JSON 对象）：**
{
  "cases": [
    {"case": "nominativ", "article": "der", "nounForm": "Hund"},
    {"case": "genitiv", "article": "des", "nounForm": "Hundes"},
    {"case": "dativ", "article": "dem", "nounForm": "Hund"},
    {"case": "akkusativ", "article": "den", "nounForm": "Hund"}
  ]
}

请直接返回JSON对象，不要添加任何解释或markdown格式。`

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的德语变格表生成工具。只返回有效的JSON对象，严格遵守德语语法规则，特别是阴性名词第二格不能加词尾。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2, // 降低温度以提高准确性
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}'
    
    // Clean the response
    let cleanedResponse = responseText
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '')
    }

    let declensionTable: DeclensionTable
    try {
      declensionTable = JSON.parse(cleanedResponse)
      
      // Validate the structure
      if (!declensionTable.cases || !Array.isArray(declensionTable.cases)) {
        throw new Error('Invalid declension table structure')
      }

      // Ensure all four cases are present
      const requiredCases = ['nominativ', 'genitiv', 'dativ', 'akkusativ']
      const presentCases = declensionTable.cases.map((c: DeclensionCase) => c.case)
      
      for (const reqCase of requiredCases) {
        if (!presentCases.includes(reqCase)) {
          throw new Error(`Missing case: ${reqCase}`)
        }
      }

      // Validate feminine genitive (must not end with -s)
      if (gender === 'f') {
        const genitivCase = declensionTable.cases.find((c: DeclensionCase) => c.case === 'genitiv')
        if (genitivCase && genitivCase.nounForm.endsWith('s')) {
          console.warn(`Warning: Feminine noun genitive should not end with 's': ${genitivCase.nounForm}`)
          // Remove the 's' suffix
          genitivCase.nounForm = genitivCase.nounForm.slice(0, -1)
        }
      }

    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response text:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse declension response', details: responseText },
        { status: 500 }
      )
    }

    return NextResponse.json(declensionTable)
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate declension table', details: error.message },
      { status: 500 }
    )
  }
}

