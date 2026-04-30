import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

import {
  getStripeConnect,
  getWhiteLabelerPaymentWebhookSecrets,
  reconcileWhiteLabelerCheckoutSession,
} from "@/lib/statxeo/white-labeler-stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ ok: true, message: "White-label Stripe webhook endpoint. Use POST." })
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

function isWhiteLabelCheckoutType(type: string) {
  const normalized = type.trim().toLowerCase()
  return (
    normalized === "checkout.session.completed" ||
    normalized === "checkout.session.async_payment_succeeded" ||
    normalized === "v1.checkout.session.completed" ||
    normalized === "v1.checkout.session.async_payment_succeeded"
  )
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")
  const secrets = getWhiteLabelerPaymentWebhookSecrets()

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature header." }, { status: 400 })
  }

  if (secrets.length === 0) {
    console.error("[stripe:white-label:webhook] missing_webhook_secrets")
    return NextResponse.json({ error: "Missing white-label Stripe webhook secret." }, { status: 400 })
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
    console.error("[stripe:white-label:webhook] signature_verification_failed", {
      hasSignature: Boolean(signature),
      secretsConfigured: secrets.length,
    })
    return NextResponse.json({ error: "Stripe signature verification failed." }, { status: 400 })
  }

  const eventType = typeof event.type === "string" ? event.type : ""

  if (isWhiteLabelCheckoutType(eventType)) {
    let session: Stripe.Checkout.Session | null = null

    if (isSnapshotEvent(event)) {
      session = event.data.object as Stripe.Checkout.Session
    } else {
      const sessionId = getThinRelatedObjectId(event)
      if (sessionId) {
        session = await stripe.checkout.sessions.retrieve(sessionId)
      }
    }

    if (session && session.payment_status === "paid") {
      try {
        await reconcileWhiteLabelerCheckoutSession({
          session,
          eventId: event.id,
        })
      } catch (reconcileError) {
        console.error("[stripe:white-label:webhook] reconcile_failed", {
          eventId: typeof event.id === "string" ? event.id : null,
          sessionId: session.id,
          message: reconcileError instanceof Error ? reconcileError.message : String(reconcileError),
        })
        return NextResponse.json({ error: "Checkout reconciliation failed." }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}