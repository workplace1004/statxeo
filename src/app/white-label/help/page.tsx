import {listFaqs, listKnowledgeArticles} from "../../../server/queries/support";
import {WhiteLabelHelpPage} from "../../../views/white-label/help-page";

export default async function Page() {
  const [faqs, articles] = await Promise.all([
    listFaqs("agency"),
    listKnowledgeArticles("agency"),
  ]);

  return <WhiteLabelHelpPage articles={articles} faqs={faqs} />;
}
