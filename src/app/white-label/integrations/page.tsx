import {getSession} from "../../../server/auth/session";
import {collections} from "../../../server/db/collections";
import {redirect} from "next/navigation";
import {listWhiteLabelerSocialAccounts} from "../../../server/queries/agency";
import {WhiteLabelIntegrationsPage} from "../../../views/white-label/integrations-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session || session.persona !== "white-label") {
    redirect("/login");
  }

  const usersCol = await collections.users();
  const user = await usersCol.findOne({email: session.email.toLowerCase()});

  if (!user || !user.organizationId) {
    redirect("/onboarding/white-label");
  }

  const agencyOrgId = user.organizationId;
  const socialAccounts = await listWhiteLabelerSocialAccounts({agencyOrgId});

  return (
    <WhiteLabelIntegrationsPage
      socialAccounts={socialAccounts}
      metaAdsConnected={!!user.metaAdsAccessToken}
      googleAdsConnected={!!user.googleAdsRefreshToken}
      googleAdsCustomerId={user.googleAdsCustomerId ?? null}
    />
  );
}
