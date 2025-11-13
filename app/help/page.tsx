import Link from "next/link"
import { HelpSearch } from "@/components/help/HelpSearch"
import { HelpPromoBanner } from "@/components/help/HelpPromoBanner"
import { getAllCategories } from "@/lib/helpData"
import { BookOpen, ArrowRight } from "lucide-react"

export default function HelpPage() {
  const categories = getAllCategories()

  const featuredCategories = categories.slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
          How can we help you?
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Find answers to common questions and learn how to get the most out of Voxe
        </p>
      </div>

      {/* Search */}
      <div className="flex justify-center">
        <HelpSearch />
      </div>

      {/* Featured Categories */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {featuredCategories.map((category) => (
          <Link
            key={category.id}
            href={`/help/${category.slug}`}
            className="block p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg transition-all hover:border-blue-500 dark:hover:border-blue-500"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {category.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  {category.description}
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                  {category.articles.length} articles
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* All Categories */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          Browse by Category
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/help/${category.slug}`}
              className="block p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {category.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {category.articles.length} articles
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Promotional Banner */}
      <HelpPromoBanner />

      {/* Support Links */}
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Still need help?
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

