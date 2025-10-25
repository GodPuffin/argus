import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DatabasePage() {
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
      </div>
    </div>
  )
}
