import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

import {
  getStripeConnect,
  getStripeConnectWebhookSecrets,
  syncWhiteLabelerStripeAccountFromAccount,
} from "@/lib/statxeo/white-labeler-stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ ok: true, message: "Stripe Connect webhook endpoint. Use POST." })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isSnapshotEvent(value: unknown): value is Stripe.Event {
  return isRecord(value) && value.object === "event" && typeof value.type === "string"
}

function getThinRelatedObjectId(value: unknown) {
  if (!isRecord(value) || !isRecord(value.related_object)) return null
  const id = value.related_object.id
  return typeof id === "string" && id.trim() ? id.trim() : null
}

function isConnectAccountUpdatedType(type: string) {
  const normalized = type.trim().toLowerCase()
  return normalized === "account.updated" || normalized === "v1.account.updated"
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")
  const secrets = getStripeConnectWebhookSecrets()

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature header." }, { status: 400 })
  }

  if (secrets.length === 0) {
    return NextResponse.json({ error: "Missing Stripe Connect webhook secret." }, { status: 400 })
  }

  const payload = await request.text()
  const stripe = getStripeConnect()
  let event: Stripe.Event | Record<string, unknown> | null = null

  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(payload, signature, secret)
      break
    } catch {
      event = null
    }
  }

  if (!event) {
    return NextResponse.json({ error: "Stripe signature verification failed." }, { status: 400 })
  }

  const eventType = typeof event.type === "string" ? event.type : ""

  if (isConnectAccountUpdatedType(eventType)) {
    let account: Stripe.Account | null = null

    if (isSnapshotEvent(event)) {
      account = event.data.object as Stripe.Account
    } else {
      const accountId = getThinRelatedObjectId(event)
      if (accountId) {
        const retrieved = await stripe.accounts.retrieve(accountId)
        if (!("deleted" in retrieved && retrieved.deleted)) {
          account = retrieved
        }
      }
    }

    if (account) {
    await syncWhiteLabelerStripeAccountFromAccount({
      account,
      eventId: event.id,
    })
    }
  }

  return NextResponse.json({ received: true })
}