import {Suspense} from "react";

import {PartnersSignInPage} from "@/shared/login/partners-sign-in-page";

export default function Page() {
  return (
    <Suspense>
      <PartnersSignInPage />
    </Suspense>
  );
}
