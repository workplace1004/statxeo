import {NextRequest, NextResponse} from "next/server";
import {ObjectId} from "mongodb";

import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {collections} from "@/server/db/collections";
import {socialPostInputSchema} from "@/server/db/schemas/social-posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST: Create a new social media post draft or schedule it.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedWhiteLabeler(request);
    if (auth.errorResponse) return auth.errorResponse;
    const {orgId: agencyOrgId} = auth.ctx!;

    const body = await request.json();
    
    // Server-side Zod Validation
    const validated = socialPostInputSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {error: "Validation failed", details: validated.error.format()},
        {status: 400}
      );
    }

    const data = validated.data;

    // Additional Validation: ScheduledFor must be in the future if status is Scheduled
    if (data.status === "Scheduled" && data.scheduledFor.getTime() <= Date.now()) {
      return NextResponse.json(
        {error: "Scheduled time must be in the future"},
        {status: 400}
      );
    }

    const postsCol = await collections.socialPosts();
    const newDoc = {
      _id: new ObjectId(),
      agencyOrgId,
      customerOrgId: data.customerOrgId ?? null,
      customerId: data.customerId ?? null,
      customerName: data.customerName,
      customerAvatar: data.customerAvatar ?? null,
      platform: data.platform,
      status: data.status,
      title: data.title,
      body: data.body,
      mediaUrls: data.mediaUrls,
      scheduledFor: data.scheduledFor,
      aiGenerated: data.aiGenerated,
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
        impressions: 0,
      },
      approvalRequestedAt: data.status === "Awaiting Approval" ? new Date() : null,
      approvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await postsCol.insertOne(newDoc);

    return NextResponse.json({ok: true, data: {id: newDoc._id.toHexString()}}, {status: 201});
  } catch (error: any) {
    console.error("[POST /api/social/posts] error:", error);
    return NextResponse.json({error: "Internal Server Error"}, {status: 500});
  }
}
