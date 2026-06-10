'use client'

import { useState, useEffect } from 'react'
import { languages } from '@/app/lib/i18n'

type Language = 'es' | 'en' | 'pt'

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<Language>('es')
  const [isOpen, setIsOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'es' || saved === 'en' || saved === 'pt')) {
      setCurrentLang(saved)
    }
  }, [])

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang)
    localStorage.setItem('language', lang)
    setIsOpen(false)
    window.location.reload()
  }

  const currentLangData = languages.find(l => l.code === currentLang)

  if (!isClient) {
    return <div className="w-20 h-8" />
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition"
      >
        <span>{currentLangData?.flag}</span>
        <span className="text-sm">{currentLangData?.name}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-20">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code as Language)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                  currentLang === lang.code ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
