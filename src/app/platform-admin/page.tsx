import {getPlatformAgencies, getPlatformGlobalMrr, getPlatformLeads} from "../../server/queries/platform";
import {PlatformAdminDashboardPage} from "../../views/platform-admin/dashboard-page";

export default async function Page() {
  // In a real app, we would verify isPlatformAdmin(session.role) here or in middleware
  const [agencies, totalMrr, leads] = await Promise.all([
    getPlatformAgencies(),
    getPlatformGlobalMrr(),
    getPlatformLeads(),
  ]);

  return (
    <PlatformAdminDashboardPage 
      agencies={agencies}
      totalMrr={totalMrr}
      leads={leads}
    />
  );
}
