"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Share2, Copy, Download, Mail, MessageSquare, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ShareDialogProps {
  summaryId: string
  title: string
  summary: string
}

export default function ShareDialog({ summaryId, title, summary }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isGeneratingPublicLink, setIsGeneratingPublicLink] = useState(false)
  const [publicLink, setPublicLink] = useState<string | null>(null)

  const shareUrl = `${window.location.origin}/shared/${summaryId}`
  const shareText = `Check out this AI-generated summary: "${title}"`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied to clipboard",
        description: "The link has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  const generatePublicLink = async () => {
    setIsGeneratingPublicLink(true)
    try {
      const response = await fetch(`/api/summaries/${summaryId}/share`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setPublicLink(data.shareUrl)
        toast({
          title: "Public link created",
          description: "Your summary is now publicly shareable.",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to create public link",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPublicLink(false)
    }
  }

  const exportToPDF = async () => {
    try {
      const response = await fetch(`/api/summaries/${summaryId}/export?format=pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "PDF exported",
          description: "Your summary has been downloaded as a PDF.",
        })
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  const exportToMarkdown = async () => {
    try {
      const response = await fetch(`/api/summaries/${summaryId}/export?format=markdown`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Markdown exported",
          description: "Your summary has been downloaded as a Markdown file.",
        })
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Summary</DialogTitle>
          <DialogDescription>Share this summary with others or export it in different formats.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">Share</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="share-link">Share Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="share-link" value={publicLink || shareUrl} readOnly className="flex-1" />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(publicLink || shareUrl)}
                    className="flex items-center gap-1"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {!publicLink && (
                <Button onClick={generatePublicLink} disabled={isGeneratingPublicLink} className="w-full">
                  {isGeneratingPublicLink ? "Creating Public Link..." : "Create Public Link"}
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const emailUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${publicLink || shareUrl}`)}`
                    window.open(emailUrl)
                  }}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(publicLink || shareUrl)}`
                    window.open(twitterUrl, "_blank")
                  }}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Twitter
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-3">
              <Button onClick={exportToPDF} variant="outline" className="w-full flex items-center gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export as PDF
              </Button>

              <Button
                onClick={exportToMarkdown}
                variant="outline"
                className="w-full flex items-center gap-2 bg-transparent"
              >
                <Download className="h-4 w-4" />
                Export as Markdown
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
