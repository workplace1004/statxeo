import { NextRequest, NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  getCustomerAdminSupabaseClientOrResponse,
  getAuthenticatedCustomer,
  resolveCustomerLeadIds,
} from "@/lib/statxeo/customer-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type LeadImageFileRow = {
  id: string | null
  lead_id: string | null
  public_url: string | null
  storage_bucket: string | null
  storage_path: string | null
}

type CustomerDocumentFileRow = {
  id: string | null
  lead_id: string | null
  public_url: string | null
  storage_bucket: string | null
  storage_path: string | null
}

async function redirectToDocumentUrl(
  adminClient: SupabaseClient,
  file: {
    public_url: string | null
    storage_bucket: string | null
    storage_path: string | null
  },
) {
  if (typeof file.public_url === "string" && file.public_url.length > 0) {
    return NextResponse.redirect(file.public_url)
  }

  if (file.storage_bucket && file.storage_path) {
    const { data: signedData, error: signedError } = await adminClient
      .storage
      .from(file.storage_bucket)
      .createSignedUrl(file.storage_path, 60 * 15)

    if (!signedError && signedData?.signedUrl) {
      return NextResponse.redirect(signedData.signedUrl)
    }
  }

  return NextResponse.json({ error: "Document not found." }, { status: 404 })
}

export async function GET(request: NextRequest) {
  const authContext = await getAuthenticatedCustomer()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const documentId = (request.nextUrl.searchParams.get("document_id") ?? "").trim()
  if (!documentId) {
    return NextResponse.json({ error: "document_id is required." }, { status: 400 })
  }

  const adminClient = getCustomerAdminSupabaseClientOrResponse()
  if (adminClient instanceof NextResponse) {
    return adminClient
  }

  const leadIds = await resolveCustomerLeadIds(adminClient, authContext.email, authContext.user.id)

  if (leadIds.length === 0) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 })
  }

  const { data: documentData, error: documentError } = await adminClient
    .from("statxeo_customer_documents")
    .select("id, lead_id, public_url, storage_bucket, storage_path")
    .eq("id", documentId)
    .in("lead_id", leadIds)
    .maybeSingle()

  if (!documentError && documentData) {
    return redirectToDocumentUrl(adminClient, documentData as CustomerDocumentFileRow)
  }

  const { data: imageData, error: imageError } = await adminClient
    .from("statxeo_lead_images")
    .select("id, lead_id, public_url, storage_bucket, storage_path")
    .eq("id", documentId)
    .in("lead_id", leadIds)
    .maybeSingle()

  if (imageError || !imageData) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 })
  }

  return redirectToDocumentUrl(adminClient, imageData as LeadImageFileRow)
}
