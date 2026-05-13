import { redirect } from "next/navigation"

import { WhiteLabelerSocialSettings } from "@/components/sections/white-labeler-social-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAuthenticatedWhiteLabeler, isWhiteLabelerAdminRole } from "@/lib/statxeo/white-labeler-server"

export const dynamic = "force-dynamic"

export default async function AdminSocialDashboard() {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof Response) {
    if (authContext.status === 401) {
      redirect("/white-labeler/login?next=/white-labeler/admin/social")
    }

    redirect("/white-labeler")
  }

  if (!isWhiteLabelerAdminRole(authContext.role)) {
    redirect("/white-labeler")
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Master Social Dashboard</h1>
        <p className="text-muted-foreground">
          Manage platform-level social connections and monitor global posting activity.
        </p>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="compose">Composer</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connections" className="mt-6">
          <WhiteLabelerSocialSettings />
        </TabsContent>

        <TabsContent value="compose" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Unified Post Composer</CardTitle>
              <CardDescription>Draft content to be published across multiple platforms.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                Composer Interface Coming Next...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Post History</CardTitle>
              <CardDescription>Monitor the status of all posts sent through the platform.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                Post History Table Coming Next...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
