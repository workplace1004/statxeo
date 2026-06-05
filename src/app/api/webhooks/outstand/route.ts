import {NextRequest, NextResponse} from "next/server";
import {createHmac} from "node:crypto";
import {ObjectId} from "mongodb";

import {collections} from "@/server/db/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST: Outstand Webhook Listener
 * Receives publishing events (success/failed) and updates the SocialPostDoc status.
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-outstand-signature");
    if (!signature) {
      return NextResponse.json({error: "Missing signature"}, {status: 401});
    }

    const payloadText = await request.text();
    const secret = process.env.AUTH_SESSION_SECRET;

    if (!secret) {
      console.error("[Webhook] AUTH_SESSION_SECRET is not configured.");
      return NextResponse.json({error: "Server configuration error"}, {status: 500});
    }

    // Verify HMAC SHA256 Signature
    const expectedSignature = createHmac("sha256", secret)
      .update(payloadText)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("[Webhook] Invalid signature received.");
      return NextResponse.json({error: "Invalid signature"}, {status: 403});
    }

    const payload = JSON.parse(payloadText);
    const {id, status} = payload; // Assuming payload has { id, status }

    if (!id || !status) {
      return NextResponse.json({error: "Invalid payload format"}, {status: 400});
    }

    const postsCol = await collections.socialPosts();
    
    // Update the post status
    const updateResult = await postsCol.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: status, 
          updatedAt: new Date(),
          ...(status === "Published" ? { publishedAt: new Date() } : {})
        } 
      }
    );

    if (updateResult.matchedCount === 0) {
      console.warn(`[Webhook] Post with ID ${id} not found.`);
      return NextResponse.json({error: "Post not found"}, {status: 404});
    }

    console.log(`[Webhook] Successfully updated post ${id} to status ${status}`);
    return NextResponse.json({ok: true});
  } catch (error: any) {
    console.error("[POST /api/webhooks/outstand] error:", error);
    return NextResponse.json({error: "Internal Server Error"}, {status: 500});
  }
}
