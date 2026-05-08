import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { normalizeRole } from "@/lib/statxeo/white-labeler-server"
import { WhiteLabelerSocialSettings } from "@/components/sections/white-labeler-social-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default async function AdminSocialDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/white-labeler/login?next=/white-labeler/admin/social")
  }

  // Check if user is admin/owner
  const { data: membership } = await supabase
    .from("statxeo_white_labeler_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()

  const role = normalizeRole(membership?.role)
  if (role !== "owner" && role !== "admin") {
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
