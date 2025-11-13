"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import Link from "next/link"
import { HelpArticle, searchArticles, getAllArticles } from "@/lib/helpData"

interface HelpSearchProps {
  onResultClick?: () => void
}

export function HelpSearch({ onResultClick }: HelpSearchProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const allArticles = useMemo(() => getAllArticles(), [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchArticles(query, allArticles).slice(0, 5)
  }, [query, allArticles])

  const handleResultClick = () => {
    setQuery("")
    setIsOpen(false)
    onResultClick?.()
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search help articles..."
          className="w-full pl-12 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setIsOpen(false)
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-96 overflow-y-auto">
          {results.map((article) => (
            <Link
              key={article.id}
              href={`/help/${article.categorySlug}/${article.slug}`}
              onClick={handleResultClick}
              className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
            >
              <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                {article.title}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {article.excerpt}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {article.category}
              </div>
            </Link>
          ))}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 text-center text-slate-600 dark:text-slate-400">
          No articles found for "{query}"
        </div>
      )}
    </div>
  )
}

