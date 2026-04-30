import { NextResponse } from "next/server"

export type WhiteLabelerLaunchBlocker = {
  code: string
  message: string
}

export type WhiteLabelerApiErrorBody = {
  error: string
  code?: string
  retryable?: boolean
  issues?: unknown
  blockers?: WhiteLabelerLaunchBlocker[]
  launchReadiness?: Record<string, unknown>
}

export function whiteLabelerJsonError(body: WhiteLabelerApiErrorBody, status: number) {
  return NextResponse.json(body, { status })
}
