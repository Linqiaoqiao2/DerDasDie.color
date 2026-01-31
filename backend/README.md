# 🐱 DerDieDas File Upload Service

A tiny FastAPI backend that extracts text from your documents 😺

## What DerDieDas Does

- 😼 Auto-identify German nouns and mark their gender
- 🐱 Color-coded: 🔵 der · 🔴 die · 🟢 das
- 😸 Click words → see declension table (Nominativ / Genitiv / Dativ / Akkusativ)
- 😻 Star words → save to vocabulary book
- 🐾 Vocabulary Book: Flashcards + Article Quiz with SM-2 spaced repetition

## Supported Formats

| Format | Extension |
|--------|-----------|
| 🐱 PDF | `.pdf` |
| 😺 Word | `.docx` |
| 😸 Text | `.txt` |

## Quick Start

```bash
cd backend
./start.sh
```

That's it! 😸 The server runs at http://localhost:8000

> 😺 First time? The script auto-creates a virtual environment and installs everything.

## Usage

`POST /upload` with your file → get extracted text back 🐾

Full docs → http://localhost:8000/docs

## Notes

- 😼 Max file size: **10MB**
- 😿 Scanned PDFs (images) won't work — no OCR yet!
- 😺 TXT files auto-detect encoding

---

Made with 😻 for German learners
