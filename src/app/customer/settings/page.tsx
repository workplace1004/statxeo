import {getCurrentCustomerOrgId} from "../../../server/context";
import {
  getBusinessProfile,
  listCustomerTeam,
  listDomains,
  listIntegrations,
  listNotificationPreferences,
} from "../../../server/queries/customer";
import {CustomerSettingsPage} from "../../../views/customer/settings-page";

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();
  const [businessProfile, domains, notificationPrefs, integrations, team] = await Promise.all([
    getBusinessProfile({customerOrgId}),
    listDomains({customerOrgId}),
    listNotificationPreferences({customerOrgId}),
    listIntegrations({customerOrgId}),
    listCustomerTeam({customerOrgId}),
  ]);

  return (
    <CustomerSettingsPage
      businessProfile={businessProfile}
      domains={domains}
      integrations={integrations}
      notificationPrefs={notificationPrefs}
      team={team}
    />
  );
}
