import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardContent from "@/components/dashboard-content"
import { Brain, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch user's summaries
  const { data: summaries, error: summariesError } = await supabase
    .from("blog_summaries")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  if (summariesError) {
    console.error("Error fetching summaries:", summariesError)
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">BlogSummarizer</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/summarize">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Summary
              </Button>
            </Link>
            <form action="/auth/signout" method="post">
              <Button variant="outline" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <DashboardContent summaries={summaries || []} user={data.user} profile={profile} />
    </div>
  )
}
