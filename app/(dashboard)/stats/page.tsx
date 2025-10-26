"use client"

import { useEffect, useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { LuxeCard as Card, LuxeCardContent as CardContent, LuxeCardDescription as CardDescription, LuxeCardHeader as CardHeader, LuxeCardTitle as CardTitle } from "@/components/ui/luxe-card"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Activity, 
  CheckCircle2, 
  TrendingUp,
  Radio,
  ChevronDown,
  Clock
} from "lucide-react"

// Chart components
import { JobStatusChart } from "@/components/stats/job-status-chart"
import { DetectionClassChart } from "@/components/stats/detection-class-chart"
import { StreamStatusChart } from "@/components/stats/stream-status-chart"
import { TopTagsChart } from "@/components/stats/top-tags-chart"
import { DetectionsByHourChart } from "@/components/stats/detections-by-hour-chart"
import { JobsTimelineChart } from "@/components/stats/jobs-timeline-chart"
import { DetectionsTimelineChart } from "@/components/stats/detections-timeline-chart"
import { OccupancyChart } from "@/components/stats/occupancy-chart"
import { ProcessingVolumeChart } from "@/components/stats/processing-volume-chart"
import { EventSeverityChart } from "@/components/stats/event-severity-chart"
import { EventTypeChart } from "@/components/stats/event-type-chart"
import { TopEntitiesChart } from "@/components/stats/top-entities-chart"
import { CameraActivityChart } from "@/components/stats/camera-activity-chart"
import { EntityTypeChart } from "@/components/stats/entity-type-chart"
import { AssetDurationChart } from "@/components/stats/asset-duration-chart"

// Hooks
import { useStatsRealtime } from "@/hooks/use-stats-realtime"

import type { StatsData } from "@/lib/stats-queries"

type TimeRange = '24h' | '7d' | '30d' | 'all'
type TabType = 'Events' | 'Jobs'

const STATS_TIME_RANGE_KEY = "stats-time-range"
const STATS_ACTIVE_TAB_KEY = "stats-active-tab"

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Load saved tab from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STATS_ACTIVE_TAB_KEY) as TabType
      if (saved && ['Events', 'Jobs'].includes(saved)) {
        return saved
      }
    }
    return 'Events'
  })
  
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    // Load saved time range from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STATS_TIME_RANGE_KEY) as TimeRange
      if (saved && ['24h', '7d', '30d', 'all'].includes(saved)) {
        return saved
      }
    }
    return 'all'
  })
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)

  // Real-time updates - always enabled
  const { lastUpdate } = useStatsRealtime({
    enabled: true,
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
    }
    // Don't show refetching indicator for time range changes
    
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
      }
      setIsRefetching(false)
    }
  }

  // Initial load and time range changes
  useEffect(() => {
    const isInitial = loading && stats === null
    fetchStats(timeRange, isInitial)
    // Save time range to localStorage
    localStorage.setItem(STATS_TIME_RANGE_KEY, timeRange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem(STATS_ACTIVE_TAB_KEY, activeTab)
  }, [activeTab])

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Statistics">
        {lastUpdate && (
          <Badge variant="outline" className="text-xs">
            Updated {lastUpdate.toLocaleTimeString()}
          </Badge>
        )}
      </SiteHeader>
      
      <ScrollArea className="h-[calc(100vh-6rem)]">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 pb-0 md:gap-6 md:p-6 md:pb-0">
          {/* Controls */}
          <div className="flex items-center justify-between gap-3">
            <div key="section-tabs">
              <AnimatedTabs
                tabs={["Events", "Jobs"]}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as TabType)}
              />
            </div>
            
            <div key="time-filter">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {timeRange === "24h" ? "24 Hours" :
                       timeRange === "7d" ? "7 Days" :
                       timeRange === "30d" ? "30 Days" :
                       "All Time"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem
                    onClick={() => setTimeRange("24h")}
                    className={timeRange === "24h" ? "bg-accent" : ""}
                  >
                    24 Hours
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTimeRange("7d")}
                    className={timeRange === "7d" ? "bg-accent" : ""}
                  >
                    7 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTimeRange("30d")}
                    className={timeRange === "30d" ? "bg-accent" : ""}
                  >
                    30 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTimeRange("all")}
                    className={timeRange === "all" ? "bg-accent" : ""}
                  >
                    All Time
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-6">
            {/* Key Metrics Cards - Events Tab */}
            {activeTab === 'Events' && loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} variant="revealed-pointer">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeTab === 'Events' && stats && stats.esMetrics ? (
              <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-opacity duration-200 ${isRefetching ? 'opacity-60' : 'opacity-100'}`}>
                {/* Total Events */}
                <Card variant="revealed-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.esMetrics.eventSeverity.reduce((sum, e) => sum + e.count, 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      AI-analyzed events detected
                    </p>
                  </CardContent>
                </Card>

                {/* Critical Events */}
                <Card variant="revealed-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
                    <Activity className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.esMetrics.eventSeverity.find(e => e.severity === 'High')?.count.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      High severity alerts
                    </p>
                  </CardContent>
                </Card>

                {/* Event Types */}
                <Card variant="revealed-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Event Types</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.esMetrics.eventTypes.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Different event categories
                    </p>
                  </CardContent>
                </Card>

                {/* Detected Entities */}
                <Card variant="revealed-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Detected Entities</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.esMetrics.topEntities.reduce((sum, e) => sum + e.count, 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total entity occurrences
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Key Metrics Cards - Jobs Tab */}
            {activeTab === 'Jobs' && loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} variant="revealed-pointer">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeTab === 'Jobs' && stats ? (
              <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-opacity duration-200 ${isRefetching ? 'opacity-60' : 'opacity-100'}`}>
                {/* Total Jobs */}
                <Card variant="revealed-pointer">
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
                <Card variant="revealed-pointer">
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
                <Card variant="revealed-pointer">
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
                <Card variant="revealed-pointer">
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

            {/* Charts Grid - Events Tab */}
            {activeTab === 'Events' && loading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(9)].map((_, i) => (
                  <Card key={i} variant="revealed-pointer">
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
            ) : activeTab === 'Events' && stats && stats.esMetrics ? (
              <div className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-200 ${isRefetching ? 'opacity-60' : 'opacity-100'}`}>
                {/* Event Severity */}
                <EventSeverityChart data={stats.esMetrics.eventSeverity} />

                {/* Event Types */}
                <EventTypeChart data={stats.esMetrics.eventTypes} />

                {/* Entity Type Distribution */}
                <EntityTypeChart data={stats.esMetrics.entityTypes} />

                {/* Top Entities */}
                <TopEntitiesChart data={stats.esMetrics.topEntities} />

                {/* Recording Length Distribution */}
                <AssetDurationChart data={stats.assetDurations} />

                {/* Top AI Analysis Tags */}
                <TopTagsChart data={stats.topTags} />

                {/* Occupancy Over Time */}
                <div className="md:col-span-2">
                  <div className="md:col-span-1">
                    <OccupancyChart data={stats.occupancyData} />
                  </div>
                </div>
                {/* Detections Timeline */}
                <div className="md:col-span-1">
                  <DetectionsTimelineChart data={stats.detectionsTimeline} />
                </div>
              </div>
            ) : null}

            {/* Charts Grid - Jobs Tab */}
            {activeTab === 'Jobs' && loading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} variant="revealed-pointer">
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
            ) : activeTab === 'Jobs' && stats ? (
              <div className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-200 ${isRefetching ? 'opacity-60' : 'opacity-100'}`}>
                {/* AI Job Status Distribution */}
                <JobStatusChart data={stats.jobStats} />

                {/* Stream Status */}
                <StreamStatusChart data={stats.streamStats} />
                
                {/* Detection Classes */}
                <DetectionClassChart data={stats.detectionStats.classCounts} />

                {/* Processing Volume */}
                <div className="md:col-span-1">
                  <ProcessingVolumeChart data={stats.processingVolume} />
                </div>
                {/* Jobs Timeline */}
                <div className="md:col-span-2">
                  <JobsTimelineChart data={stats.jobsTimeline} />
                </div>

              </div>
            ) : null}

            {/* No Data Available */}
            {!loading && !stats && (
              <Card variant="revealed-pointer">
                <CardHeader>
                  <CardTitle>No Data Available</CardTitle>
                  <CardDescription>
                    Unable to load statistics. Please try again later.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
