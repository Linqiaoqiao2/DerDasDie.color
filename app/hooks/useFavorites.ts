'use client'

import { useState, useEffect } from 'react'

const KEY = 'derdiedas-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<any[]>([])

  useEffect(() => {
    const saved = localStorage.getItem(KEY)
    if (saved) setFavorites(JSON.parse(saved))
  }, [])

  const save = (list: any[]) => {
    setFavorites(list)
    localStorage.setItem(KEY, JSON.stringify(list))
  }

  const addFavorite = (noun: any) => {
    if (favorites.some(f => f.lemma === noun.lemma)) return
    save([...favorites, { ...noun, timestamp: Date.now() }])
  }

  const removeFavorite = (lemma: string) => save(favorites.filter(f => f.lemma !== lemma))

  const toggleFavorite = (noun: any) => 
    favorites.some(f => f.lemma === noun.lemma) ? removeFavorite(noun.lemma) : addFavorite(noun)

  const isFavorited = (lemma: string) => favorites.some(f => f.lemma === lemma)

  return { favorites, addFavorite, removeFavorite, toggleFavorite, isFavorited }
}
