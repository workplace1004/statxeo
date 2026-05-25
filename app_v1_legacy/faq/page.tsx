import type { Metadata } from "next"
import Script from "next/script"

export const metadata: Metadata = {
  title: "Statxeo FAQ | SEO Website, Lead Routing, and 10DLC Questions",
  description:
    "Answers to the most common questions about Statxeo website packages, hosting, lead routing, SEO setup, and 10DLC-ready messaging.",
}

const faqs = [
  {
    question: "What does Statxeo actually include?",
    answer:
      "Statxeo includes a website build, conversion-focused messaging, SEO structure, hosted delivery, and lead routing into Statxt. Higher tiers add deeper page architecture and stronger SEO coverage.",
  },
  {
    question: "Is this a monthly website fee?",
    answer:
      "No. The website packages are one-time purchases. Boost Packages are optional monthly add-ons for ongoing growth work.",
  },
  {
    question: "How fast can my first draft go live?",
    answer:
      "The homepage messaging targets a fast turnaround, with the first draft often prepared within about 24 hours once intake details are complete.",
  },
  {
    question: "Do you handle lead routing too?",
    answer:
      "Yes. Statxeo is designed to send inbound form leads into Statxt and can support direct phone-oriented workflows for faster follow-up.",
  },
  {
    question: "Why mention 10DLC on a website sales page?",
    answer:
      "Because businesses buying this product often need compliant messaging workflows tied to text-based follow-up. The site and lead flow should support that reality from the start.",
  },
  {
    question: "Do you support AI or LLM discoverability?",
    answer:
      "Yes. Statxeo supports AI-readable discovery with structured copy and llms output intended to help modern agents understand the site more clearly.",
  },
  {
    question: "Who owns the website after delivery?",
    answer:
      "Ownership depends on tier. Lander is managed by Statxt. Core and Titan customers own the delivered site content and page structure, while Statxt retains rights to the underlying framework and platform.",
  },
  {
    question: "Are purchases refundable?",
    answer:
      "All Statxeo and Boost sales are final. Payments are non-refundable once processed, so please review package scope and terms before checkout.",
  },
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
}

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-20 sm:px-6 lg:px-8">
      <Script id="statxeo-faq-jsonld" type="application/ld+json">
        {JSON.stringify(faqJsonLd)}
      </Script>
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-mono uppercase tracking-[0.22em] text-primary">FAQ</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Answers buyers expect before they trust the offer.
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            These answers help clarify what Statxeo sells, how hosting and routing work, and why SEO plus compliance positioning matters for service businesses.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((item) => (
            <section key={item.question} className="neo-surface rounded-3xl p-6">
              <h2 className="text-xl font-semibold text-foreground">{item.question}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{item.answer}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
