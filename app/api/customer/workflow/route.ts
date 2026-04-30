import { NextResponse } from "next/server"

import {
  getCustomerAdminSupabaseClientOrResponse,
  getAuthenticatedCustomer,
  resolveCustomerLeadIds,
} from "@/lib/statxeo/customer-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type WorkflowTaskRow = {
  id: string | null
  title: string | null
  description: string | null
  status: string | null
  signed_off_at: string | null
}

type WorkflowStageStatus = "pending" | "in_progress" | "completed"

const EMPTY_WORKFLOW = {
  id: "",
  status: "not_started" as const,
  stages: [] as Array<{
    name: string
    title?: string
    description?: string
    status: WorkflowStageStatus
    completed_at?: string | null
  }>,
}

function normalizeStageStatus(rawStatus: string | null | undefined): WorkflowStageStatus {
  const normalized = (rawStatus ?? "").trim().toLowerCase()

  if (normalized === "completed" || normalized === "done") return "completed"
  if (normalized === "in_progress" || normalized === "active" || normalized === "processing") return "in_progress"
  return "pending"
}

export async function GET() {
  const authContext = await getAuthenticatedCustomer()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const adminClient = getCustomerAdminSupabaseClientOrResponse()
  if (adminClient instanceof NextResponse) {
    return adminClient
  }

  const leadIds = await resolveCustomerLeadIds(adminClient, authContext.email, authContext.user.id)

  if (leadIds.length === 0) {
    return NextResponse.json(EMPTY_WORKFLOW)
  }

  const leadId = leadIds[0]
  const { data, error } = await adminClient
    .from("statxeo_workflow_tasks")
    .select("id, title, description, status, signed_off_at, updated_at, sort_order, created_at")
    .eq("lead_id", leadId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error || !Array.isArray(data) || data.length === 0) {
    return NextResponse.json(EMPTY_WORKFLOW)
  }

  const taskRows = data as WorkflowTaskRow[]
  const stages = taskRows.map((task, index) => {
    const resolvedTitle = (typeof task.title === "string" && task.title.trim()) || `Stage ${index + 1}`

    const stageDescription =
      typeof task.description === "string" && task.description.trim().length > 0
        ? task.description
        : undefined

    const stageStatus = normalizeStageStatus(task.status)

    return {
      name: resolvedTitle,
      title: resolvedTitle,
      description: stageDescription,
      status: stageStatus,
      completed_at: stageStatus === "completed" ? task.signed_off_at : null,
    }
  })

  const allCompleted = stages.every((stage) => stage.status === "completed")
  const allPending = stages.every((stage) => stage.status === "pending")

  const workflowStatus = allCompleted ? "completed" : allPending ? "not_started" : "in_progress"

  return NextResponse.json({
    id: leadId,
    status: workflowStatus,
    stages,
  })
}
