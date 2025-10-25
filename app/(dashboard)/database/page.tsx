"use client"

import { useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DatabasePage() {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ events: number; analysis: number } | null>(null)

  const handleReindex = async () => {
    setSyncing(true)
    setSyncResult(null)
    
    try {
      const response = await fetch('/api/search/sync?type=all', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSyncResult(data.counts)
      } else {
        console.error('Reindex error:', data.error)
        alert(`Reindex failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Reindex failed:', error)
      alert('Reindex failed. Check console for details.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Database" />
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
            <CardDescription>Explore Events, Entities, and more.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Database UI coming soon.</p>
          </CardContent>
        </Card>

        {/* Admin Section */}
        <Card className="border-orange-500/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Admin Tools
                  <Badge variant="outline" className="text-orange-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Dev/Admin Only
                  </Badge>
                </CardTitle>
                <CardDescription>Administrative operations for managing search indices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reindex Button */}
            <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Reindex Search Data</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Clear and rebuild the Elasticsearch index with all events and analysis results from the database.
                    This will sync all existing data to make it searchable.
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={syncing}
                    className="w-fit"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Reindexing...' : 'Reindex All Search Data'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reindex Search Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reindex all events and analysis results to Elasticsearch.
                      This operation may take a few moments depending on the amount of data.
                      <br /><br />
                      <strong>This is safe to run and won't delete any database data.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReindex}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {syncResult && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    ✓ Reindex completed successfully
                  </p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>Events: <strong>{syncResult.events}</strong></span>
                    <span>Analysis: <strong>{syncResult.analysis}</strong></span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
