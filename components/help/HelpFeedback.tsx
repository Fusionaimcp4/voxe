"use client"

import { useState } from "react"
import { ThumbsUp, ThumbsDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HelpFeedbackProps {
  articleId: string
  articleTitle: string
}

export function HelpFeedback({ articleId, articleTitle }: HelpFeedbackProps) {
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFeedbackSelect = (value: "positive" | "negative") => {
    if (submitted) return
    setFeedback(value)
  }

  const handleSubmit = async () => {
    if (submitted || !feedback || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/help-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          articleTitle,
          helpful: feedback === "positive",
          comment: comment || undefined,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Check className="w-5 h-5" />
          <span className="font-medium">Thank you for your feedback!</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Was this article helpful?
      </h3>
      <div className="flex items-center gap-4">
        <Button
          variant={feedback === "positive" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFeedbackSelect("positive")}
          disabled={submitted || isSubmitting}
          className="flex items-center gap-2"
        >
          <ThumbsUp className="w-4 h-4" />
          Yes
        </Button>
        <Button
          variant={feedback === "negative" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFeedbackSelect("negative")}
          disabled={submitted || isSubmitting}
          className="flex items-center gap-2"
        >
          <ThumbsDown className="w-4 h-4" />
          No
        </Button>
      </div>
      {feedback && !submitted && (
        <div className="mt-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              feedback === "positive"
                ? "What did you find helpful? (optional)"
                : "What can we improve? (optional)"
            }
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-2"
            size="sm"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      )}
    </div>
  )
}

