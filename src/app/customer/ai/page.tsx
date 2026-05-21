import {getCurrentCustomerOrgId} from "../../../server/context";
import {listAiSettings, listAiTasks, listChatHistory} from "../../../server/queries/customer";
import {CustomerAiPage} from "../../../views/customer/ai-page";

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();
  const [tasks, settings, chat] = await Promise.all([
    listAiTasks({customerOrgId}),
    listAiSettings({customerOrgId}),
    listChatHistory({customerOrgId}),
  ]);

  return <CustomerAiPage chat={chat} settings={settings} tasks={tasks} />;
}
