import {getPlatformAgencies, getPlatformGlobalMrr} from "../../server/queries/platform";
import {PlatformAdminDashboardPage} from "../../views/platform-admin/dashboard-page";

export default async function Page() {
  // In a real app, we would verify isPlatformAdmin(session.role) here or in middleware
  const [agencies, totalMrr] = await Promise.all([
    getPlatformAgencies(),
    getPlatformGlobalMrr(),
  ]);

  return (
    <PlatformAdminDashboardPage 
      agencies={agencies}
      totalMrr={totalMrr}
    />
  );
}
