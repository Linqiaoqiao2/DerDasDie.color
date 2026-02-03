# DerDieDas.color 🐱

> *"Why is a fork masculine, a spoon feminine, and a knife neutral?"*  

Stop guessing. Start seeing. Paste any German text, and watch nouns light up by gender:
- **der** → blue
- **die** → red  
- **das** → green

Click a word to see its declension table. Star it to save for later.

## Getting Started

You'll need:
- Node.js 18+
- Python 3.9+
- A [DeepSeek API](https://platform.deepseek.com/) key

```bash
# Clone and install
git clone https://github.com/yourusername/DerDieDas.color.git
cd DerDieDas.color
npm install

# Add your API key
echo "DEEPSEEK_API_KEY=sk-xxx" > .env.local

# Start backend (handles file uploads)
cd backend && ./start.sh

# Start frontend (in another terminal)
npm run dev
```

Open http://localhost:3000 and you're good to go.

## Features

**Reading Mode** — Paste text or upload a file (PDF, Word, TXT). The app sends it to DeepSeek to identify nouns and their genders, then renders everything with color-coded articles.

**Declension Tables** — Click any colored noun to see all four cases (Nominativ, Genitiv, Dativ, Akkusativ).

**Vocabulary Book** — Star words you want to remember. Review them later with flashcards. Data stays in your browser's localStorage.

**File Upload** — The Python backend extracts text from PDFs (via pdfplumber), Word docs, and plain text files. Max 10MB, no OCR.

**Text-to-Speech** — Click the speaker icon to hear pronunciation. Uses browser's built-in speech synthesis.

**i18n** — UI available in English, German, and Chinese.

## Project Layout

```
app/
  api/analyze/       → DeepSeek integration
  api/declension/    → Declension logic  
  components/        → React components
  hooks/             → useFavorites, useTTS
  i18n/              → Translations

backend/
  main.py            → FastAPI file upload service
  start.sh           → One-click setup script
```

## Tech

- Next.js 14 + TypeScript + CSS Modules
- FastAPI + pdfplumber + python-docx
- DeepSeek API for noun analysis
- Framer Motion for animations

## Notes

- Vocabulary is stored locally, no sync between devices yet

