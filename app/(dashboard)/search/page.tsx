"use client"

import { useState, useEffect } from "react"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Clock, Video, Camera, FileVideo, RefreshCw } from "lucide-react"

interface SearchResult {
  id: string
  score: number
  source: {
    type: 'stream' | 'camera' | 'recording'
    title: string
    description?: string
    content?: string
    tags?: string[]
    created_at: string
    updated_at: string
    metadata?: Record<string, any>
  }
  highlights?: Record<string, string[]>
}

interface SearchResponse {
  query: string
  results: SearchResult[]
  total: number
  took: number
  filters: {
    type: string | null
    dateRange: { from: string; to: string } | null
  }
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<string>("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const params = new URLSearchParams({ q: query })
      if (type && type !== "all") params.append("type", type)

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      if (response.ok) {
        setResults(data.results)
        setSearchResponse(data)
      } else {
        console.error("Search error:", data.error)
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/search/sync?type=all', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (response.ok) {
        console.log('Sync successful:', data)
        // Optionally re-run search after sync
        if (query.trim()) {
          await handleSearch()
        }
      } else {
        console.error('Sync error:', data.error)
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "stream": return <Video className="h-4 w-4" />
      case "camera": return <Camera className="h-4 w-4" />
      case "recording": return <FileVideo className="h-4 w-4" />
      default: return <Video className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Search" />
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Search Content</CardTitle>
                <CardDescription>Search across streams, cameras, and recordings</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Data'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for content..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="stream">Streams</SelectItem>
                  <SelectItem value="camera">Cameras</SelectItem>
                  <SelectItem value="recording">Recordings</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={loading || !query.trim()}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchResponse && (
              <div className="text-sm text-muted-foreground">
                Found {searchResponse.total} results in {searchResponse.took}ms
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-4">
                {results.map((result) => (
                  <Card key={result.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(result.source.type)}
                          <Badge variant="outline">{result.source.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Score: {result.score.toFixed(2)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{result.source.title}</h3>
                        {result.source.description && (
                          <p className="text-muted-foreground mb-2">{result.source.description}</p>
                        )}
                        {result.highlights && Object.keys(result.highlights).length > 0 && (
                          <div className="mb-2">
                            {Object.entries(result.highlights).map(([field, highlights]) => (
                              <div key={field} className="text-sm">
                                <span className="font-medium capitalize">{field}:</span>{" "}
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: highlights.join(" ... ")
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        {result.source.tags && result.source.tags.length > 0 && (
                          <div className="flex gap-1 mb-2">
                            {result.source.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created: {formatDate(result.source.created_at)}
                          </div>
                          {result.source.updated_at !== result.source.created_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Updated: {formatDate(result.source.updated_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!loading && query && results.length === 0 && searchResponse && (
              <div className="text-center py-8 text-muted-foreground">
                {searchResponse.total === 0 && searchResponse.took === 0 ? (
                  <div className="space-y-2">
                    <p>Elasticsearch is not configured yet.</p>
                    <p className="text-sm">Please add your Elasticsearch credentials to your .env.local file:</p>
                    <code className="block text-xs bg-muted p-2 rounded">
                      ELASTICSEARCH_URL=https://your-cluster-url:9200<br/>
                      ELASTICSEARCH_API_KEY=your_api_key_here
                    </code>
                  </div>
                ) : (
                  <p>No results found for "{query}"</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

