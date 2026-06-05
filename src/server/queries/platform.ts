import {collections} from "../db/collections";
import {serializeOrganization, type Organization} from "../db/schemas/organizations";

export interface AgencyData extends Organization {
  customerCount: number;
  activeCampaigns: number;
}

export async function getPlatformAgencies(): Promise<AgencyData[]> {
  const orgsCol = await collections.organizations();
  const customersCol = await collections.customers();
  const campaignsCol = await collections.campaigns();

  const agencies = await orgsCol.find({ type: "agency" }).toArray();
  
  const result: AgencyData[] = [];
  
  for (const agency of agencies) {
    const customerCount = await customersCol.countDocuments({ whiteLabelerId: agency._id.toString() });
    const activeCampaigns = await campaignsCol.countDocuments({ 
      whiteLabelerId: agency._id.toString(),
      status: "active" 
    });
    
    result.push({
      ...serializeOrganization(agency),
      customerCount,
      activeCampaigns,
    });
  }

  return result;
}

export async function getPlatformGlobalMrr(): Promise<number> {
  // In a real implementation, this would aggregate billing records.
  // For now, we will just return a mock aggregate.
  return 125000; 
}
