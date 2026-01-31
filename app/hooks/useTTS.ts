'use client'

import { useState, useCallback } from 'react'

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback((text: string) => {
    if (!text || !('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'de-DE'
    u.rate = 0.9
    const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('de'))
    if (voice) u.voice = voice
    
    u.onstart = () => setIsSpeaking(true)
    u.onend = u.onerror = () => setIsSpeaking(false)
    speechSynthesis.speak(u)
  }, [])

  const stop = useCallback(() => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  return { speak, stop, isSpeaking }
}
