import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Statxeo",
  description:
    "Read the Statxeo privacy policy covering data categories, use, sharing, cookies, retention, security, rights, children, updates, and contact.",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-mono uppercase tracking-[0.22em] text-primary">Privacy Policy</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Privacy policy for Statxeo</h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            This policy explains how Statxeo collects, uses, shares, and protects personal and business information provided through our website, intake forms, checkout, and support interactions.
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Data categories we collect</h2>
            <p>
              We may collect contact details (name, email, phone), business details (business name, address, industry, EIN, service descriptions), technical and usage data (IP address, browser type, page events), payment and billing metadata from payment providers, and communication records related to onboarding and support.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">How we use data</h2>
            <p>
              We use data to deliver purchased services, set up websites and lead routing, process payments, communicate project updates, detect fraud and abuse, improve product quality, and meet legal and compliance requirements.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Sharing and vendors</h2>
            <p>
              We share information only as needed with service providers such as hosting, analytics, communications, CRM, and payment processors. Vendors process data under contractual obligations and only for approved service purposes. We may also disclose information when legally required or to enforce our terms.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Cookies and analytics</h2>
            <p>
              We and our vendors may use cookies, pixels, and similar technologies to measure traffic, understand site performance, and improve user experience. You can manage cookies in your browser settings, but some features may not function properly if cookies are blocked.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Retention and security</h2>
            <p>
              We retain information for as long as needed to provide services, maintain records, resolve disputes, and satisfy legal obligations. We apply reasonable administrative, technical, and organizational safeguards, but no system can be guaranteed 100% secure.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Your rights (including California)</h2>
            <p>
              Depending on your location, you may have rights to request access, correction, deletion, portability, and limitations on data use. California residents may also request details regarding categories of personal information collected, disclosed, or shared. To submit a request, contact us using the details below.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Children's privacy</h2>
            <p>
              Statxeo is intended for business users and is not directed to children under 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Policy updates</h2>
            <p>
              We may update this policy from time to time. Material changes will be reflected on this page with an updated effective date.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p>
              For privacy requests or questions, contact Statxt support through your active account channels or the contact methods provided during onboarding.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
