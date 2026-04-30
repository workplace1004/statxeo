import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProductTerms() {
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
          Product Terms
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Website vs. Boost scope</h2>
            <p>
              Statxeo website packages are one-time implementation services for website delivery and lead-routing setup. Boost packages are recurring growth services that may include content, automation, and distribution work according to the selected plan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Account requirement</h2>
            <p>
              A valid account may be required to receive leads, manage workflows, and access related delivery components. Service performance may be limited if required account access is missing, suspended, or not in good standing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Communications consent</h2>
            <p>
              By purchasing, you authorize Statxt to contact you via email, phone, and SMS for onboarding, verification, delivery, billing, and support communications related to your order.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Payment authorization</h2>
            <p>
              You represent that you are authorized to use the payment method provided and authorize charges for selected one-time and recurring services, including applicable taxes and fees.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Cancellation expectations</h2>
            <p>
              Website implementation begins after order intake and may not be canceled once production work has started. Boost services can be canceled for future billing periods according to plan settings, but already billed periods and completed work remain non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">All sales final; no refunds</h2>
            <p>
              All product and service purchases are final. Payments are non-refundable once processed.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
