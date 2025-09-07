import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate a shareable token (in production, you'd want a more secure approach)
    const shareToken = `${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // For now, we'll just return the share URL
    // In a full implementation, you'd store the share token in the database
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/shared/${id}?token=${shareToken}`

    return NextResponse.json({ shareUrl })
  } catch (error) {
    console.error("Share API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
