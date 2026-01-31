'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../i18n'
import { UploadIcon, FileTextIcon, XIcon, AlertIcon, LoaderIcon, PawIcon } from './Icons'
import styles from './FileUpload.module.css'

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

  const handleFile = (f: File) => { setError(null); const err = validate(f); err ? setError(err) : setFile(f) }

  const clear = () => { setFile(null); setError(null); setProgress(null); if (inputRef.current) inputRef.current.value = '' }

  const upload = async () => {
    if (!file) return
    setUploading(true); setError(null); setProgress(t.upload.uploading)
    try {
      const form = new FormData(); form.append('file', file)
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

  const formatSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`
  const dropCls = [styles.dropZone, isDrag && styles.dropZoneDragging, file && styles.dropZoneWithFile, (disabled || uploading) && styles.dropZoneDisabled].filter(Boolean).join(' ')
  const fileIcon = file?.name.endsWith('.pdf') ? styles.fileIconPdf : file?.name.endsWith('.docx') ? styles.fileIconDocx : styles.fileIconTxt

  return (
    <div className={styles.container}>
      <motion.div
        onDragOver={e => { e.preventDefault(); if (!disabled) setIsDrag(true) }}
        onDragLeave={e => { e.preventDefault(); setIsDrag(false) }}
        onDrop={e => { e.preventDefault(); setIsDrag(false); if (!disabled && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
        onClick={!file ? () => inputRef.current?.click() : undefined}
        className={dropCls}
        animate={{ scale: isDrag ? 1.02 : 1 }}
      >
        <input ref={inputRef} type="file" accept={EXTS.join(',')} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} className={styles.hiddenInput} disabled={disabled || uploading} />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.dropContent}>
              <div className={`${styles.iconCircle} ${isDrag ? styles.iconCircleDragging : ''}`}>
                <UploadIcon className={`${styles.uploadIcon} ${isDrag ? styles.uploadIconDragging : ''}`} />
              </div>
              <div>
                <p className={styles.dropText}>{isDrag ? t.upload.dropHere : t.upload.dragDrop}</p>
                <p className={styles.supportedFormats}>{t.upload.supportedFormats}</p>
                <p className={styles.maxSize}>{t.upload.maxSize.replace('{size}', String(MAX_MB))}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={styles.filePreview}>
              <div className={styles.fileInfo}>
                <FileTextIcon className={fileIcon} />
                <div className={styles.fileDetails}>
                  <p className={styles.fileName}>{file.name}</p>
                  <p className={styles.fileSize}>{formatSize(file.size)}</p>
                </div>
              </div>
              {!uploading && <button onClick={e => { e.stopPropagation(); clear() }} className={styles.clearButton}><XIcon className={styles.clearIcon} /></button>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={styles.errorMessage}>
            <AlertIcon className={styles.errorIcon} /><p className={styles.errorText}>{error}</p>
          </motion.div>
        )}
        {progress && !error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={styles.progressMessage}>
            {uploading ? <LoaderIcon className={styles.progressIcon} /> : <PawIcon className={styles.successIcon} />}
            <p className={styles.progressText}>{progress}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {file && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={upload} disabled={uploading || disabled}
          className={`${styles.extractButton} ${uploading || disabled ? styles.extractButtonDisabled : ''}`}>
          {uploading ? <><LoaderIcon className={styles.buttonIcon} />{t.upload.extracting}</> : <><UploadIcon className={styles.buttonIcon} />{t.upload.extractText}</>}
        </motion.button>
      )}
    </div>
  )
}
