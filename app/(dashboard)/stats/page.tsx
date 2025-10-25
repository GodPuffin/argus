"use client"

import { useEffect, useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Activity, 
  CheckCircle2, 
  TrendingUp,
  Radio
} from "lucide-react"

// Chart components
import { JobStatusChart } from "@/components/stats/job-status-chart"
import { DetectionClassChart } from "@/components/stats/detection-class-chart"
import { StreamStatusChart } from "@/components/stats/stream-status-chart"
import { CameraActivityChart } from "@/components/stats/camera-activity-chart"
import { TopTagsChart } from "@/components/stats/top-tags-chart"
import { DetectionsByHourChart } from "@/components/stats/detections-by-hour-chart"
import { JobsTimelineChart } from "@/components/stats/jobs-timeline-chart"
import { DetectionsTimelineChart } from "@/components/stats/detections-timeline-chart"
import { OccupancyChart } from "@/components/stats/occupancy-chart"
import { ProcessingVolumeChart } from "@/components/stats/processing-volume-chart"

// Hooks
import { useStatsRealtime } from "@/hooks/use-stats-realtime"

import type { StatsData } from "@/lib/stats-queries"

type TimeRange = '24h' | '7d' | '30d' | 'all'

export default function StatsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [realtimeEnabled, setRealtimeEnabled] = useState(true)

  // Real-time updates
  const { lastUpdate } = useStatsRealtime({
    enabled: realtimeEnabled,
    onUpdate: () => {
      // Refetch stats when updates occur
      if (!loading) {
        fetchStats(timeRange)
      }
    },
  })

  // Fetch stats from API
  const fetchStats = async (range: TimeRange, isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setIsRefetching(true)
    }
    
    try {
      const response = await fetch(`/api/stats?range=${range}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      if (isInitial) {
        setLoading(false)
      } else {
        setIsRefetching(false)
      }
    }
  }

  // Initial load and time range changes
  useEffect(() => {
    const isInitial = loading && stats === null
    fetchStats(timeRange, isInitial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Statistics" />
      
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Time Range Selector */}
          <div className="flex items-center gap-3">
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <TabsList>
                <TabsTrigger value="24h">24 Hours</TabsTrigger>
                <TabsTrigger value="7d">7 Days</TabsTrigger>
                <TabsTrigger value="30d">30 Days</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
            {isRefetching && (
              <Badge variant="outline" className="text-xs">
                <Activity className="mr-1 h-3 w-3 animate-pulse" />
                Updating...
              </Badge>
            )}
          </div>

          {/* Real-time Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="realtime"
              checked={realtimeEnabled}
              onCheckedChange={setRealtimeEnabled}
            />
            <Label htmlFor="realtime" className="flex items-center gap-2 cursor-pointer">
              <Radio className={`h-4 w-4 ${realtimeEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
              Real-time Updates
            </Label>
            {lastUpdate && realtimeEnabled && (
              <Badge variant="outline" className="text-xs">
                Updated {lastUpdate.toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-opacity duration-200 ${isRefetching ? 'opacity-60' : 'opacity-100'}`}>
                {/* Total Jobs */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.jobStats.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.jobStats.queued} queued, {stats.jobStats.processing} processing
                    </p>
                  </CardContent>
                </Card>

                {/* Success Rate */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.jobStats.successRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.jobStats.succeeded.toLocaleString()} succeeded
                    </p>
                  </CardContent>
                </Card>

                {/* Active Streams */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Streams</CardTitle>
                    <Radio className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.streamStats.active}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.streamStats.total} total streams
                    </p>
                  </CardContent>
                </Card>

                {/* Total Detections */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.detectionStats.totalDetections.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.detectionStats.totalFrames.toLocaleString()} frames analyzed
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Charts Grid */}
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(9)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <div className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-200 ${isRefetching ? 'opacity-60' : 'opacity-100'}`}>
                {/* Pie Charts */}
                <JobStatusChart data={stats.jobStats} />
                <StreamStatusChart data={stats.streamStats} />
                <CameraActivityChart data={stats.cameraActivity} />
                
                {/* Detection Classes */}
                <DetectionClassChart data={stats.detectionStats.classCounts} />

                {/* Bar Charts */}
                <TopTagsChart data={stats.topTags} />
                <DetectionsByHourChart data={stats.occupancyData} />

                {/* Line Charts */}
                <div className="md:col-span-2">
                  <JobsTimelineChart data={stats.jobsTimeline} />
                </div>
                <div className="md:col-span-1">
                  <DetectionsTimelineChart data={stats.detectionsTimeline} />
                </div>

                {/* Area Charts */}
                <div className="md:col-span-2">
                  <OccupancyChart data={stats.occupancyData} />
                </div>
                <div className="md:col-span-1">
                  <ProcessingVolumeChart data={stats.processingVolume} />
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Data Available</CardTitle>
                  <CardDescription>
                    Unable to load statistics. Please try again later.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
