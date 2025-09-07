import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { openai } from "@ai-sdk/openai"

interface SummarizeRequest {
  type: "url" | "content"
  url?: string
  content?: string
}

async function fetchContentFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "BlogSummarizer/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()

    // Simple HTML to text conversion (in production, you'd want a more robust solution)
    const textContent = html
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    return textContent
  } catch (error) {
    throw new Error(`Failed to fetch content from URL: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const wordCount = text.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: SummarizeRequest = await request.json()

    let contentToSummarize = ""
    let originalUrl = ""

    if (body.type === "url") {
      if (!body.url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 })
      }
      originalUrl = body.url
      contentToSummarize = await fetchContentFromUrl(body.url)
    } else if (body.type === "content") {
      if (!body.content || body.content.length < 100) {
        return NextResponse.json({ error: "Content must be at least 100 characters" }, { status: 400 })
      }
      contentToSummarize = body.content
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    let aiModel
    if (process.env.GROQ_API_KEY) {
      aiModel = groq("llama-3.3-70b-versatile")
    } else if (process.env.OPENROUTER_API_KEY) {
      aiModel = openai("mistralai/mistral-small-3.2-24b-instruct:free", {
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
      })
    } else if (process.env.OPENAI_API_KEY) {
      aiModel = openai("gpt-3.5-turbo")
    } else {
      return NextResponse.json({ error: "No AI provider configured" }, { status: 500 })
    }

    console.log("[v0] Using AI model:", aiModel)

    // Generate AI summary
    const { text: aiResponse } = await generateText({
      model: aiModel,
      prompt: `Please analyze the following blog post/article and provide a structured response in JSON format with the following fields:

1. "title": A concise, descriptive title for this content (max 100 characters)
2. "summary": A comprehensive summary of the main content (2-3 paragraphs, 150-300 words)
3. "keyPoints": An array of 4-6 key takeaways or main points (each 15-30 words)
4. "tags": An array of 3-8 relevant tags/topics covered in the content

Content to analyze:
${contentToSummarize.substring(0, 8000)}

Respond only with valid JSON, no additional text or formatting.`,
    })

    console.log("[v0] Raw AI response:", aiResponse)

    let cleanedResponse = aiResponse.trim()

    // Remove markdown code block formatting if present
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "")
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, "").replace(/\s*```$/, "")
    }

    console.log("[v0] Cleaned response:", cleanedResponse)

    let parsedResponse
    try {
      parsedResponse = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error("[v0] Failed to parse AI response:", parseError)
      console.error("[v0] Response that failed to parse:", cleanedResponse)

      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0])
          console.log("[v0] Successfully parsed JSON from match")
        } catch (fallbackError) {
          console.error("[v0] Fallback parsing also failed:", fallbackError)
          return NextResponse.json(
            { error: "Failed to generate summary - invalid AI response format" },
            { status: 500 },
          )
        }
      } else {
        return NextResponse.json({ error: "Failed to generate summary - no valid JSON found" }, { status: 500 })
      }
    }

    if (!parsedResponse.title || !parsedResponse.summary || !parsedResponse.keyPoints || !parsedResponse.tags) {
      console.error("[v0] Invalid response structure:", parsedResponse)
      return NextResponse.json({ error: "Failed to generate summary - incomplete response" }, { status: 500 })
    }

    console.log("[v0] Successfully parsed response:", parsedResponse)

    const readingTime = estimateReadingTime(contentToSummarize)

    // Save to database
    const { data: savedSummary, error: dbError } = await supabase
      .from("blog_summaries")
      .insert({
        user_id: user.id,
        title: parsedResponse.title,
        original_url: originalUrl || null,
        original_content: contentToSummarize,
        summary: parsedResponse.summary,
        key_points: parsedResponse.keyPoints,
        tags: parsedResponse.tags,
        reading_time: readingTime,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to save summary" }, { status: 500 })
    }

    return NextResponse.json({
      id: savedSummary.id,
      title: parsedResponse.title,
      summary: parsedResponse.summary,
      keyPoints: parsedResponse.keyPoints,
      tags: parsedResponse.tags,
      readingTime,
    })
  } catch (error) {
    console.error("[v0] Summarize API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
