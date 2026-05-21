import {getCurrentAgencyOrgId} from "../../../server/context";
import {
  listAgencyActivityLog,
  listAgencyTeam,
} from "../../../server/queries/agency";
import {WhiteLabelTeamPage} from "../../../views/white-label/team-page";

export default async function Page() {
  const agencyOrgId = await getCurrentAgencyOrgId();

  const [members, log] = await Promise.all([
    listAgencyTeam({agencyOrgId}),
    listAgencyActivityLog({agencyOrgId}),
  ]);

  return <WhiteLabelTeamPage log={log} members={members} />;
}
