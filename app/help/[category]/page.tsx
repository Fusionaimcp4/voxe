import { notFound } from "next/navigation"
import Link from "next/link"
import { HelpSidebar } from "@/components/help/HelpSidebar"
import { Breadcrumbs } from "@/components/help/Breadcrumbs"
import { HelpSearch } from "@/components/help/HelpSearch"
import { getCategoryBySlug, getAllCategories } from "@/lib/helpData"
import { ArrowRight } from "lucide-react"

interface CategoryPageProps {
  params: Promise<{
    category: string
  }>
}

export async function generateStaticParams() {
  const categories = getAllCategories()
  return categories.map((category) => ({
    category: category.slug,
  }))
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params
  const category = getCategoryBySlug(categorySlug)

  if (!category) {
    notFound()
  }

  const categories = getAllCategories()

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <div className="lg:w-64 flex-shrink-0">
        <HelpSidebar categories={categories} currentCategory={category.slug} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Breadcrumbs
          items={[
            { label: "Help", href: "/help" },
            { label: category.title },
          ]}
        />

        <div className="mb-8">
          <HelpSearch />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {category.title}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {category.description}
            </p>
          </div>

          <div className="space-y-4">
            {category.articles.map((article) => (
              <Link
                key={article.id}
                href={`/help/${category.slug}/${article.slug}`}
                className="block p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg transition-all hover:border-blue-500 dark:hover:border-blue-500"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      {article.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {article.excerpt}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

