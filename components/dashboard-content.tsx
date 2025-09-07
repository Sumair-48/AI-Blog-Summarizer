"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Clock, Calendar, Tag, FileText, BookOpen, Filter, ExternalLink, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Summary {
  id: string
  title: string
  summary: string
  key_points: string[]
  tags: string[]
  reading_time: number
  original_url?: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
}

interface Profile {
  id: string
  email: string
  full_name?: string
}

interface DashboardContentProps {
  summaries: Summary[]
  user: User
  profile?: Profile
}

export default function DashboardContent({ summaries, user, profile }: DashboardContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalSummaries = summaries.length
    const totalReadingTime = summaries.reduce((acc, summary) => acc + summary.reading_time, 0)
    const averageReadingTime = totalSummaries > 0 ? Math.round(totalReadingTime / totalSummaries) : 0
    const allTags = summaries.flatMap((s) => s.tags)
    const uniqueTags = [...new Set(allTags)]

    return {
      totalSummaries,
      totalReadingTime,
      averageReadingTime,
      uniqueTags: uniqueTags.length,
      topTags: uniqueTags.slice(0, 5),
    }
  }, [summaries])

  // Get all unique tags for filtering
  const allTags = useMemo(() => {
    const tags = summaries.flatMap((s) => s.tags)
    return [...new Set(tags)].sort()
  }, [summaries])

  // Filter and sort summaries
  const filteredSummaries = useMemo(() => {
    const filtered = summaries.filter((summary) => {
      const matchesSearch =
        searchQuery === "" ||
        summary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTag = selectedTag === "all" || summary.tags.includes(selectedTag)

      return matchesSearch && matchesTag
    })

    // Sort summaries
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "reading-time":
        filtered.sort((a, b) => b.reading_time - a.reading_time)
        break
    }

    return filtered
  }, [summaries, searchQuery, selectedTag, sortBy])

  const handleDeleteSummary = async (summaryId: string) => {
    if (!confirm("Are you sure you want to delete this summary?")) return

    try {
      const response = await fetch(`/api/summaries/${summaryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to delete summary:", error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!
        </h2>
        <p className="text-gray-600">Here's your reading summary dashboard</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Summaries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSummaries}</div>
            <p className="text-xs text-muted-foreground">Articles summarized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalReadingTime}m</div>
            <p className="text-xs text-muted-foreground">Reading time saved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Article Length</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageReadingTime}m</div>
            <p className="text-xs text-muted-foreground">Average reading time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics Covered</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueTags}</div>
            <p className="text-xs text-muted-foreground">Different topics</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search summaries, titles, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="reading-time">Reading Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summaries Grid */}
      {filteredSummaries.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {summaries.length === 0 ? "No summaries yet" : "No summaries match your filters"}
            </h3>
            <p className="text-gray-600 mb-4">
              {summaries.length === 0
                ? "Start by creating your first blog summary"
                : "Try adjusting your search or filter criteria"}
            </p>
            {summaries.length === 0 && (
              <Link href="/summarize">
                <Button>Create Your First Summary</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSummaries.map((summary) => (
            <Card key={summary.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2 text-balance">{summary.title}</CardTitle>
                  <div className="flex gap-1 ml-2">
                    <Link href={`/summary/${summary.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSummary(summary.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {summary.reading_time}m read
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true })}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">{summary.summary}</p>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Key Points:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {summary.key_points.slice(0, 2).map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="line-clamp-1">{point}</span>
                        </li>
                      ))}
                      {summary.key_points.length > 2 && (
                        <li className="text-xs text-gray-500">+{summary.key_points.length - 2} more points</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {summary.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {summary.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{summary.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {summary.original_url && (
                    <div className="pt-2 border-t">
                      <a
                        href={summary.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Original Article
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
