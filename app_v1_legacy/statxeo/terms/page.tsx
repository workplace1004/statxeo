import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HostedSiteTerms() {
  return (
    <main className="min-h-screen bg-background py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Statxeo
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
          Statxeo Hosted Site Terms
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Tier-specific ownership</h2>
            <p>
              Lander websites are managed by Statxt on Statxt infrastructure. For Core and Titan, the customer owns the delivered site content and structure, while Statxt retains all rights to the underlying framework, platform, automation logic, and proprietary implementation assets.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Acceptable use and content responsibility</h2>
            <p>
              The customer is responsible for all submitted content, claims, offers, and legal disclosures. You must not use Statxeo services for unlawful, deceptive, abusive, infringing, or harmful activity. Statxt may suspend access for violations, fraud risk, or non-payment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Custom domains and hosting</h2>
            <p>
              Domains remain customer-owned through your registrar. Statxt may provide DNS guidance but is not responsible for registrar outages, DNS propagation delays, expiration events, or third-party hosting failures outside Statxt control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Compliance obligations</h2>
            <p>
              Where messaging or lead workflows rely on regulated channels (including 10DLC), the customer must provide accurate business information, maintain required consents, and cooperate with compliance updates. Approval outcomes from carriers or third parties are not guaranteed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">All sales final; no refunds</h2>
            <p>
              All Statxeo purchases are final. Fees are non-refundable once payment is processed, including one-time website fees and any related setup charges.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Liability limits</h2>
            <p>
              Services are provided "as is" and "as available." To the maximum extent allowed by law, Statxt disclaims implied warranties and is not liable for indirect, incidental, special, consequential, or punitive damages. Aggregate liability is limited to the amount paid by the customer for the specific service giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Florida law and arbitration</h2>
            <p>
              These terms are governed by Florida law, without regard to conflict-of-law rules. Disputes will be resolved by binding individual arbitration in Florida, and both parties waive class or representative actions to the extent permitted by law.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
