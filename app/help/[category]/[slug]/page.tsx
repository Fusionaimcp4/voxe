import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { HelpSidebar } from "@/components/help/HelpSidebar"
import { Breadcrumbs } from "@/components/help/Breadcrumbs"
import { HelpSearch } from "@/components/help/HelpSearch"
import { HelpFeedback } from "@/components/help/HelpFeedback"
import { HelpPromoBanner } from "@/components/help/HelpPromoBanner"
import {
  getArticle,
  getAllCategories,
  getAllArticles,
  getCategoryBySlug,
} from "@/lib/helpData"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ArticlePageProps {
  params: Promise<{
    category: string
    slug: string
  }>
}

function renderMarkdown(content: string): React.ReactNode {
  // Enhanced markdown rendering
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let currentList: string[] = []
  let inList = false
  let inCodeBlock = false
  let codeBlockContent: string[] = []

  function renderInlineMarkdown(text: string): React.ReactNode {
    // Handle bold
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-sm font-mono text-slate-900 dark:text-slate-100">
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Code blocks
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre key={`code-${index}`} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto mb-4">
            <code className="text-sm font-mono text-slate-900 dark:text-slate-100">
              {codeBlockContent.join("\n")}
            </code>
          </pre>
        )
        codeBlockContent = []
        inCodeBlock = false
      } else {
        // Start code block
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      return
    }

    // Headings
    if (trimmed.startsWith("#### ")) {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1 ml-4">
            {currentList.map((item, i) => (
              <li key={i} className="text-slate-700 dark:text-slate-300">
                {renderInlineMarkdown(item.replace(/^[-*]\s+/, ""))}
              </li>
            ))}
          </ul>
        )
        currentList = []
        inList = false
      }
      elements.push(
        <h4 key={index} className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-4">
          {trimmed.replace(/^####\s+/, "")}
        </h4>
      )
      return
    }

    // List items
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.match(/^\d+\.\s/)) {
      if (!inList) {
        inList = true
        currentList = []
      }
      currentList.push(trimmed)
      return
    }

    // Regular paragraphs
    if (trimmed) {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1 ml-4">
            {currentList.map((item, i) => (
              <li key={i} className="text-slate-700 dark:text-slate-300">
                {renderInlineMarkdown(item.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))}
              </li>
            ))}
          </ul>
        )
        currentList = []
        inList = false
      }
      elements.push(
        <p key={index} className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
          {renderInlineMarkdown(trimmed)}
        </p>
      )
    } else if (inList && currentList.length > 0) {
      elements.push(
        <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1 ml-4">
          {currentList.map((item, i) => (
            <li key={i} className="text-slate-700 dark:text-slate-300">
              {renderInlineMarkdown(item.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))}
            </li>
          ))}
        </ul>
      )
      currentList = []
      inList = false
    }
  })

  if (inList && currentList.length > 0) {
    elements.push(
      <ul key="list-final" className="list-disc list-inside mb-4 space-y-1 ml-4">
        {currentList.map((item, i) => (
          <li key={i} className="text-slate-700 dark:text-slate-300">
            {renderInlineMarkdown(item.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))}
          </li>
        ))}
      </ul>
    )
  }

  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <pre key="code-final" className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto mb-4">
        <code className="text-sm font-mono text-slate-900 dark:text-slate-100">
          {codeBlockContent.join("\n")}
        </code>
      </pre>
    )
  }

  return <>{elements}</>
}

export async function generateStaticParams() {
  const articles = getAllArticles()
  return articles.map((article) => ({
    category: article.categorySlug,
    slug: article.slug,
  }))
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { category, slug } = await params
  const article = getArticle(category, slug)

  if (!article) {
    return {
      title: "Article Not Found",
    }
  }

  return {
    title: `${article.title} — Voxe Help Center`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category: categorySlug, slug } = await params
  const article = getArticle(categorySlug, slug)
  const category = getCategoryBySlug(categorySlug)

  if (!article || !category) {
    notFound()
  }

  const categories = getAllCategories()

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <div className="lg:w-64 flex-shrink-0">
        <HelpSidebar
          categories={categories}
          currentCategory={category.slug}
          currentArticle={article.slug}
        />
      </div>

      {/* Main Content */}
      <article className="flex-1 min-w-0 max-w-4xl">
        <Breadcrumbs
          items={[
            { label: "Help", href: "/help" },
            { label: category.title, href: `/help/${category.slug}` },
            { label: article.title },
          ]}
        />

        <div className="mb-8">
          <HelpSearch />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8">
          <div className="mb-6">
            <Link
              href={`/help/${category.slug}`}
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {category.title}
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {article.title}
            </h1>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            {renderMarkdown(article.content)}
          </div>

          <HelpFeedback articleId={article.id} articleTitle={article.title} />
        </div>

        {/* Promotional Banner */}
        <div className="mt-8">
          <HelpPromoBanner />
        </div>
      </article>
    </div>
  )
}

