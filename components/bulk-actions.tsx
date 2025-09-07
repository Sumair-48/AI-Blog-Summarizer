"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface BulkActionsProps {
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onActionComplete: () => void
}

export default function BulkActions({ selectedIds, onSelectionChange, onActionComplete }: BulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} summaries?`)) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/summaries/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (response.ok) {
        toast({
          title: "Summaries deleted",
          description: `${selectedIds.length} summaries have been deleted.`,
        })
        onSelectionChange([])
        onActionComplete()
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkExport = async (format: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/summaries/bulk-export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds, format }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `summaries_export.${format === "pdf" ? "pdf" : "zip"}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export complete",
          description: `${selectedIds.length} summaries have been exported.`,
        })
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (selectedIds.length === 0) return null

  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border">
      <span className="text-sm font-medium">{selectedIds.length} selected</span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkDelete}
          disabled={isLoading}
          className="flex items-center gap-1 bg-transparent"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>

        <Select onValueChange={handleBulkExport}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Export" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">Export PDF</SelectItem>
            <SelectItem value="markdown">Export MD</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => onSelectionChange([])}>
          Clear
        </Button>
      </div>
    </div>
  )
}
