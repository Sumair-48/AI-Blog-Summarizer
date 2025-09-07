import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, Clock, Calendar, Tag, ExternalLink, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import ShareDialog from "@/components/share-dialog"
import EditSummaryDialog from "@/components/edit-summary-dialog"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SummaryDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch the specific summary
  const { data: summary, error: summaryError } = await supabase
    .from("blog_summaries")
    .select("*")
    .eq("id", id)
    .eq("user_id", data.user.id)
    .single()

  if (summaryError || !summary) {
    notFound()
  }

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
            <Link href="/dashboard">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Summary Header */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-4 text-balance">{summary.title}</CardTitle>
                  <CardDescription className="flex items-center gap-6 text-base">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {summary.reading_time} minute read
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true })}
                    </span>
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      {summary.tags.length} tags
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <EditSummaryDialog summary={summary} />
                  <ShareDialog summaryId={summary.id} title={summary.title} summary={summary.summary} />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Summary Content */}
          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed text-lg">{summary.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Key Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {summary.key_points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Tags & Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {summary.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {summary.original_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Original Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={summary.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Original Article
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
