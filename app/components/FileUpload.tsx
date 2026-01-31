'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../i18n'
import { UploadIcon, FileTextIcon, XIcon, AlertIcon, LoaderIcon, PawIcon } from './Icons'

const API_URL = process.env.NEXT_PUBLIC_UPLOAD_API_URL || 'http://localhost:8000'
const EXTS = ['.pdf', '.docx', '.txt']
const MAX_MB = 10

export default function FileUpload({ onTextExtracted, disabled = false }: { onTextExtracted: (text: string) => void; disabled?: boolean }) {
  const { t } = useLanguage()
  const [isDrag, setIsDrag] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = (f: File) => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!EXTS.includes(ext)) return t.upload.errorUnsupportedFormat
    if (f.size > MAX_MB * 1024 * 1024) return t.upload.errorFileTooLarge.replace('{size}', String(MAX_MB))
    return null
  }

  const handleFile = (f: File) => {
    setError(null)
    const err = validate(f)
    if (err) { setError(err); return }
    setFile(f)
  }

  const clear = () => {
    setFile(null); setError(null); setProgress(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const upload = async () => {
    if (!file) return
    setUploading(true); setError(null); setProgress(t.upload.uploading)

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || t.upload.errorUploadFailed)
      if (data.success && data.text) {
        setProgress(t.upload.extractionComplete.replace('{count}', data.word_count))
        setTimeout(() => { onTextExtracted(data.text); clear() }, 500)
      } else throw new Error(t.upload.errorNoText)
    } catch (e: any) {
      setError(e.message === 'Failed to fetch' ? t.upload.errorServiceUnavailable : e.message)
      setProgress(null)
    } finally { setUploading(false) }
  }

  const formatSize = (b: number) => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1) + ' KB' : (b/1048576).toFixed(1) + ' MB'

  return (
    <div className="w-full">
      <motion.div
        onDragOver={e => { e.preventDefault(); if (!disabled) setIsDrag(true) }}
        onDragLeave={e => { e.preventDefault(); setIsDrag(false) }}
        onDrop={e => { e.preventDefault(); setIsDrag(false); if (!disabled && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
        onClick={!file ? () => inputRef.current?.click() : undefined}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${isDrag ? 'border-amber-400 bg-amber-50 scale-[1.02]' : ''} ${file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'} ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : file ? 'cursor-default' : 'cursor-pointer'}`}
        animate={{ scale: isDrag ? 1.02 : 1 }}
      >
        <input ref={inputRef} type="file" accept={EXTS.join(',')} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" disabled={disabled || uploading} />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDrag ? 'bg-amber-200' : 'bg-amber-100'}`}>
                <UploadIcon className={`w-7 h-7 ${isDrag ? 'text-amber-600' : 'text-amber-500'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{isDrag ? t.upload.dropHere : t.upload.dragDrop}</p>
                <p className="text-xs text-gray-500 mt-1">{t.upload.supportedFormats}</p>
                <p className="text-xs text-gray-400 mt-1">{t.upload.maxSize.replace('{size}', String(MAX_MB))}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileTextIcon className={`w-6 h-6 ${file.name.endsWith('.pdf') ? 'text-rose-500' : file.name.endsWith('.docx') ? 'text-sky-500' : 'text-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                </div>
              </div>
              {!uploading && <button onClick={e => { e.stopPropagation(); clear() }} className="p-2 rounded-full hover:bg-gray-200"><XIcon className="w-5 h-5 text-gray-500" /></button>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-3 p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-2">
            <AlertIcon className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 font-medium">{error}</p>
          </motion.div>
        )}
        {progress && !error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-3 p-3 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center gap-2">
            {uploading ? <LoaderIcon className="w-5 h-5 text-amber-500" /> : <PawIcon className="w-5 h-5 text-emerald-500" />}
            <p className="text-sm text-amber-700 font-medium">{progress}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {file && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={upload} disabled={uploading || disabled}
          className={`w-full mt-4 py-3 px-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all ${uploading || disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5'}`}
        >
          {uploading ? <><LoaderIcon className="w-5 h-5" />{t.upload.extracting}</> : <><UploadIcon className="w-5 h-5" />{t.upload.extractText}</>}
        </motion.button>
      )}
    </div>
  )
}
