"use client"

import { useState, useEffect } from "react"
import { Activity, AlertCircle, CheckCircle2, RefreshCw, Server } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type HealthData = {
  status: "healthy" | "unhealthy" | "error" | "loading"
  message: string
  accountCount?: number
  checkedAt?: string
  statusCode?: number
  error?: any
}

export function SocialHealthCheckSection() {
  const [data, setData] = useState<HealthData>({ status: "loading", message: "Initializing health check..." })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkHealth = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/white-labeler/admin/social/health")
      const result = await response.json()
      setData(result)
    } catch (error) {
      setData({
        status: "error",
        message: "Failed to connect to health check endpoint."
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Social Media Engine Health</h2>
          <p className="text-muted-foreground">
            Monitor the connectivity and status of the Outstand.so API integration.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={checkHealth} 
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* API Connectivity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Connectivity</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                {data.status === "healthy" ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                ) : data.status === "loading" ? (
                  <Badge variant="secondary">Checking...</Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Issue Detected
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Last checked: {data.checkedAt ? new Date(data.checkedAt).toLocaleString() : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Connected Accounts Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Accounts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.accountCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Total social accounts connected to master API key
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status Alert */}
      {data.status === "unhealthy" || data.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="font-semibold">{data.message}</p>
            {data.statusCode && <p className="text-sm">Status Code: {data.statusCode}</p>}
            {data.error && (
              <pre className="mt-2 p-4 bg-black/10 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(data.error, null, 2)}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      ) : data.status === "healthy" ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>System Operational</AlertTitle>
          <AlertDescription>
            {data.message} All white-label social features are ready for use.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Next Steps for Admin */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Administrator Toolbox</CardTitle>
          <CardDescription>Actions to manage the social media engine.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" size="sm">View Outstand Dashboard</Button>
          <Button variant="outline" size="sm">Rotate API Key</Button>
          <Button variant="outline" size="sm">Download Logs</Button>
        </CardContent>
      </Card>
    </div>
  )
}
