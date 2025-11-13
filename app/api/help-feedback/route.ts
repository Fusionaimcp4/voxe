import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId, articleTitle, helpful, comment } = body

    // Validate input
    if (!articleId || typeof helpful !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // In a real application, you would save this to a database
    // For now, we'll just log it
    console.log("Help feedback received:", {
      articleId,
      articleTitle,
      helpful,
      comment,
      timestamp: new Date().toISOString(),
    })

    // You could integrate with:
    // - Database (Prisma)
    // - Analytics service
    // - Email notification
    // - etc.

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing feedback:", error)
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    )
  }
}

