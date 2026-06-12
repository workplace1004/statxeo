import {NextRequest, NextResponse} from "next/server";
import {getSession, createSessionToken, setSessionCookie} from "@/server/auth/session";
import {collections} from "@/server/db/collections";
import {assertCan} from "@/server/auth/permissions";
import {idToString} from "@/server/db/schemas/_helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {ok: false, error: {code: "UNAUTHORIZED", message: "Authentication required"}},
        {status: 401}
      );
    }

    const usersCol = await collections.users();
    const callerUser = await usersCol.findOne({email: session.email.toLowerCase()});

    if (!callerUser) {
      return NextResponse.json(
        {ok: false, error: {code: "UNAUTHORIZED", message: "Platform admin user record not found"}},
        {status: 401}
      );
    }

    // Verify calling user is a platform admin using permission assertion
    try {
      assertCan(callerUser.role, "impersonate_user");
    } catch {
      return NextResponse.json(
        {ok: false, error: {code: "FORBIDDEN", message: "Access denied. Platform Admin role required."}},
        {status: 403}
      );
    }

    // Parse target agencyId from request body
    const body = await request.json();
    const {agencyId} = body;

    if (!agencyId || typeof agencyId !== "string") {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing required parameter: agencyId"}},
        {status: 400}
      );
    }

    const {ObjectId} = await import("mongodb");
    if (!ObjectId.isValid(agencyId)) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Invalid agencyId format"}},
        {status: 400}
      );
    }

    // Retrieve target agency organization
    const orgsCol = await collections.organizations();
    const agencyOrg = await orgsCol.findOne({
      _id: new ObjectId(agencyId),
      type: "agency",
    });

    if (!agencyOrg) {
      return NextResponse.json(
        {ok: false, error: {code: "NOT_FOUND", message: "Target agency organization not found"}},
        {status: 404}
      );
    }

    if (!agencyOrg.ownerUserId) {
      return NextResponse.json(
        {ok: false, error: {code: "NOT_FOUND", message: "Target agency has no registered owner"}},
        {status: 404}
      );
    }

    if (!ObjectId.isValid(agencyOrg.ownerUserId)) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Invalid target agency owner ID format"}},
        {status: 400}
      );
    }

    // Retrieve the target agency owner user doc
    const targetUser = await usersCol.findOne({
      _id: new ObjectId(agencyOrg.ownerUserId),
    });

    if (!targetUser) {
      return NextResponse.json(
        {ok: false, error: {code: "NOT_FOUND", message: "Target agency owner user doc not found"}},
        {status: 404}
      );
    }

    // Log the impersonation action to the agency's activity log for auditing
    try {
      const activityLogCol = await collections.activityLog();
      await activityLogCol.insertOne({
        agencyOrgId: agencyId,
        actorUserId: idToString(callerUser._id),
        actorName: `${callerUser.name} (Platform Admin)`,
        action: "impersonated",
        target: agencyOrg.name,
        occurredAt: new Date(),
      } as any);
    } catch (e) {
      // Audit log failures must not block the impersonation flow
    }

    // Generate new impersonation session token
    const impersonatedToken = createSessionToken({
      sub: targetUser.googleSub || idToString(targetUser._id),
      email: targetUser.email,
      name: targetUser.name,
      picture: targetUser.avatarUrl || undefined,
      persona: "white-label",
    });

    await setSessionCookie(impersonatedToken);

    return NextResponse.json({ok: true});
  } catch (err: any) {
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}
