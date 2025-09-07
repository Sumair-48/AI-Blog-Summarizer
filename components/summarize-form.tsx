"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, LinkIcon, FileText, Clock, Tag, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface SummaryResult {
  id: string
  title: string
  summary: string
  keyPoints: string[]
  tags: string[]
  readingTime: number
}

export default function SummarizeForm() {
  const [url, setUrl] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (type: "url" | "content") => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          url: type === "url" ? url : undefined,
          content: type === "content" ? content : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to summarize content")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveToDashboard = () => {
    router.push("/dashboard")
  }

  if (result) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Summary Complete
              </CardTitle>
              <CardDescription>Your blog post has been successfully summarized</CardDescription>
            </div>
            <Button onClick={handleSaveToDashboard} className="ml-4">
              View in Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">{result.title}</h3>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{result.readingTime} min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              <span>{result.tags.length} tags</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Summary</h4>
            <p className="text-gray-700 leading-relaxed">{result.summary}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Key Points</h4>
            <ul className="space-y-2">
              {result.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold mt-1">•</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {result.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={() => {
                setResult(null)
                setUrl("")
                setContent("")
              }}
              variant="outline"
            >
              Summarize Another
            </Button>
            <Button onClick={handleSaveToDashboard}>Go to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Summary</CardTitle>
        <CardDescription>Choose how you'd like to input your content for summarization</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              From URL
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paste Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Blog Post URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/blog-post"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-600">Enter the URL of any blog post or article you'd like to summarize</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={() => handleSubmit("url")}
              disabled={!url.trim() || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing URL...
                </>
              ) : (
                "Summarize from URL"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Blog Post Content</Label>
              <Textarea
                id="content"
                placeholder="Paste the full text of the blog post or article here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
                rows={12}
                className="resize-none"
              />
              <p className="text-sm text-gray-600">
                Paste the complete text content you'd like to summarize (minimum 100 characters)
              </p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={() => handleSubmit("content")}
              disabled={!content.trim() || content.length < 100 || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Summary...
                </>
              ) : (
                "Summarize Content"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
