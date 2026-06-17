"use client";

import { useMemo, useState } from "react";
import {
  assetColumns,
  cameraColumns,
  eventColumns,
  jobColumns,
} from "@/components/database/columns";
import { DataTable } from "@/components/database/data-table";
import { StatTile } from "@/components/database/stat-tile";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { SiteHeader } from "@/components/site-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemoSession } from "@/hooks/use-demo-session";
import { isDemoMode } from "@/lib/demo/flag";
import {
  mockAnalysisJobs,
  mockAssets,
  mockCameras,
  mockEvents,
} from "@/lib/demo/mock-data";

const TABS = ["Cameras", "Recordings", "Events", "Jobs"] as const;
type Tab = (typeof TABS)[number];

export default function DatabasePage() {
  const session = useDemoSession();
  const [tab, setTab] = useState<Tab>("Cameras");

  const cameras = useMemo(
    () => (isDemoMode ? [...session.cameras, ...mockCameras] : mockCameras),
    [session.cameras],
  );

  const counts: Record<Tab, number> = {
    Cameras: cameras.length,
    Recordings: mockAssets.length,
    Events: mockEvents.length,
    Jobs: mockAnalysisJobs.length,
  };

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Data Explorer" />
      <PageContainer>
        <PageHeader
          title="Data Explorer"
          description="Browse every camera, recording, detected event, and analysis job in the workspace."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Cameras" value={counts.Cameras} />
          <StatTile label="Recordings" value={counts.Recordings} />
          <StatTile label="Events" value={counts.Events} />
          <StatTile label="Analysis jobs" value={counts.Jobs} />
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {t}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {counts[t]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="Cameras">
            <DataTable
              columns={cameraColumns}
              data={cameras}
              searchPlaceholder="Search cameras…"
            />
          </TabsContent>
          <TabsContent value="Recordings">
            <DataTable
              columns={assetColumns}
              data={mockAssets}
              searchPlaceholder="Search recordings…"
            />
          </TabsContent>
          <TabsContent value="Events">
            <DataTable
              columns={eventColumns}
              data={mockEvents}
              searchPlaceholder="Search events…"
            />
          </TabsContent>
          <TabsContent value="Jobs">
            <DataTable
              columns={jobColumns}
              data={mockAnalysisJobs}
              searchPlaceholder="Search jobs…"
            />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
}
