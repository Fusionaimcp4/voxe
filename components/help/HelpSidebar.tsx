"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HelpCategory } from "@/lib/helpData"
import { ChevronRight } from "lucide-react"

interface HelpSidebarProps {
  categories: HelpCategory[]
  currentCategory?: string
  currentArticle?: string
}

export function HelpSidebar({ categories, currentCategory, currentArticle }: HelpSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <nav className="sticky top-6 space-y-1">
        {categories.map((category) => {
          const isCategoryActive = currentCategory === category.slug
          const categoryPath = `/help/${category.slug}`

          return (
            <div key={category.id} className="mb-4">
              <Link
                href={categoryPath}
                className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                  isCategoryActive && !currentArticle
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {category.title}
              </Link>
              {isCategoryActive && (
                <ul className="mt-2 ml-4 space-y-1">
                  {category.articles.map((article) => {
                    const articlePath = `/help/${category.slug}/${article.slug}`
                    const isArticleActive = currentArticle === article.slug

                    return (
                      <li key={article.id}>
                        <Link
                          href={articlePath}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                            isArticleActive
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <ChevronRight className="w-3 h-3" />
                          {article.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

