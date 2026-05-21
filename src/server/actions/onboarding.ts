"use server";

import {redirect} from "next/navigation";

import {getSession} from "../auth/session";
import {collections} from "../db/collections";

async function requireSessionAndUser() {
  const session = await getSession();
  if (!session) redirect("/login");

  const c = await collections.users();
  const user = await c.findOne({
    $or: [{googleSub: session.sub}, {email: session.email}],
  });
  if (!user) redirect("/login");

  return {session, user, usersCol: c};
}

/**
 * Creates a customer organization and links it to the current user.
 * Called at the final step of the customer onboarding flow.
 */
export async function completeCustomerOnboarding(input: {
  websitePackageId: string | null;
  boostPackageId: string | null;
}): Promise<void> {
  const {user, usersCol} = await requireSessionAndUser();

  // Idempotent — if already completed, just redirect
  if (user.organizationId) {
    redirect("/customer");
  }

  const orgsCol = await collections.organizations();
  const now = new Date();

  const {insertedId} = await orgsCol.insertOne({
    type: "customer",
    name: user.name,
    ownerUserId: user._id.toHexString(),
    brand: {
      logoLightUrl: null,
      logoDarkUrl: null,
      primaryColor: null,
      secondaryColor: null,
      accentColor: null,
      customDomain: null,
      emailFrom: null,
    },
    createdAt: now,
    updatedAt: now,
  } as never);

  await usersCol.updateOne(
    {_id: user._id},
    {
      $set: {
        organizationId: insertedId.toHexString(),
        role: "customer_owner" as const,
        accountType: "customer" as const,
        updatedAt: now,
      },
    },
  );

  redirect("/customer");
}

/**
 * Creates an agency organization and links it to the current user.
 * Called at the final step of the white-label onboarding flow.
 */
export async function completeAgencyOnboarding(input: {
  agencyName: string;
  website: string;
  brandName: string;
  primaryColor: string;
  supportEmail: string;
}): Promise<void> {
  const {user, usersCol} = await requireSessionAndUser();

  if (user.organizationId) {
    redirect("/white-label");
  }

  const orgsCol = await collections.organizations();
  const now = new Date();

  const orgName = (input.agencyName || input.brandName || user.name).trim();

  const {insertedId} = await orgsCol.insertOne({
    type: "agency",
    name: orgName,
    ownerUserId: user._id.toHexString(),
    brand: {
      logoLightUrl: null,
      logoDarkUrl: null,
      primaryColor: input.primaryColor || null,
      secondaryColor: null,
      accentColor: null,
      customDomain: input.website || null,
      emailFrom: input.supportEmail || null,
    },
    createdAt: now,
    updatedAt: now,
  } as never);

  await usersCol.updateOne(
    {_id: user._id},
    {
      $set: {
        organizationId: insertedId.toHexString(),
        role: "agency_owner" as const,
        accountType: "agency" as const,
        name: input.brandName || user.name,
        updatedAt: now,
      },
    },
  );

  redirect("/white-label");
}

/**
 * Updates the affiliate user's profile and marks onboarding complete.
 * Affiliates are not linked to an organization — they are identified by user._id.
 */
export async function completeAffiliateOnboarding(input: {
  fullName: string;
  payoutEmail: string;
}): Promise<void> {
  const {user, usersCol} = await requireSessionAndUser();

  const now = new Date();

  await usersCol.updateOne(
    {_id: user._id},
    {
      $set: {
        name: input.fullName || user.name,
        role: "affiliate" as const,
        accountType: "affiliate" as const,
        updatedAt: now,
      },
    },
  );

  redirect("/affiliate");
}
