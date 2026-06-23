"use client";

import type {FaqItem, KnowledgeArticle} from "../../server/db/schemas/support-tickets";
import type {ComponentType} from "react";

import {ArrowRightFromSquare, Book, Comment, LifeRing, Sparkles, Video} from "@gravity-ui/icons";
import {Accordion, Card, Link, SearchField} from "@heroui/react";
import {useMemo, useState} from "react";

import {PageToolbar} from "../../widgets/page-toolbar";

type HelpLink = {
  description: string;
  href: string;
  icon: ComponentType<{className?: string}>;
  title: string;
};

const HELP_LINKS: readonly HelpLink[] = [
  {
    description: "Step-by-step guides for the agency console, AI agents, and API.",
    href: "https://docs.statxeo.com",
    icon: Book,
    title: "Documentation",
  },
  {
    description: "Live walkthroughs of onboarding, campaigns, and approvals.",
    href: "https://www.youtube.com/@statxeo",
    icon: Video,
    title: "Video tutorials",
  },
  {
    description: "Trade growth tactics with fellow white-label partners.",
    href: "https://community.statxeo.com",
    icon: Comment,
    title: "Partner community",
  },
  {
    description: "We answer agency tickets within one business hour. 24/7 on Enterprise.",
    href: "mailto:partners@statxeo.com",
    icon: LifeRing,
    title: "Contact support",
  },
];

export interface WhiteLabelHelpPageProps {
  faqs: FaqItem[];
  articles: KnowledgeArticle[];
}

export function WhiteLabelHelpPage({articles, faqs}: WhiteLabelHelpPageProps) {
  const [search, setSearch] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!search.trim()) return faqs;
    const q = search.toLowerCase();
    return faqs.filter(
      (faq) => faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q)
    );
  }, [faqs, search]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Get unblocked fast — docs, tutorials, community, and 1:1 support."
        showPeriod={false}
        title="Help & resources"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {HELP_LINKS.map((link) => (
          <HelpLinkCard key={link.title} link={link} />
        ))}
      </div>

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-accent-soft text-accent flex size-8 items-center justify-center rounded-xl">
              <Sparkles className="size-4" />
            </span>
            <div className="flex flex-col">
              <Card.Title className="text-base">Frequently asked questions</Card.Title>
              <Card.Description>
                Answers your agency team and customers ask most often.
              </Card.Description>
            </div>
          </div>
          <SearchField
            aria-label="Search FAQs"
            className="w-full sm:w-[220px]"
            name="faqs-search"
            onChange={setSearch}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search FAQs…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </Card.Header>
        <Card.Content>
          {filteredFaqs.length === 0 ? (
            <p className="text-muted py-6 text-center text-sm">
              {search.trim() ? "No matching FAQs found." : "No FAQs published yet. Reach out to partner support for help."}
            </p>
          ) : (
            <Accordion className="w-full">
              {filteredFaqs.map((faq, index) => (
                <Accordion.Item key={faq.id} id={`faq-${index}`}>
                  <Accordion.Heading>
                    <Accordion.Trigger>
                      {faq.question}
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body className="text-muted text-sm">{faq.answer}</Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </Card.Content>
      </Card>

      {articles.length > 0 ? (
        <Card className="rounded-2xl">
          <Card.Header>
            <Card.Title className="text-base">Knowledge base</Card.Title>
            <Card.Description>Deep-dive guides for your team.</Card.Description>
          </Card.Header>
          <Card.Content className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {articles.map((article) => (
              <div
                key={article.id}
                className="border-border bg-content1 flex flex-col gap-1 rounded-xl border p-3"
              >
                <span className="text-foreground text-sm font-medium">{article.title}</span>
                <span className="text-muted text-xs">
                  {article.category} · {article.readMinutes} min read
                </span>
              </div>
            ))}
          </Card.Content>
        </Card>
      ) : null}

      <footer className="text-muted text-xs">
        Still stuck?{" "}
        <Link className="no-underline" href="mailto:partners@statxeo.com">
          partners@statxeo.com
        </Link>
      </footer>
    </div>
  );
}

function HelpLinkCard({link}: {link: HelpLink}) {
  const Icon = link.icon;

  return (
    <Card className="rounded-2xl">
      <Card.Header>
        <div className="bg-accent-soft text-accent flex size-10 items-center justify-center rounded-xl">
          <Icon className="size-5" />
        </div>
        <Card.Title className="text-base">{link.title}</Card.Title>
        <Card.Description>{link.description}</Card.Description>
      </Card.Header>
      <Card.Footer>
        <Link
          className="text-accent inline-flex items-center gap-1 text-sm"
          href={link.href}
          rel="noopener noreferrer"
          target={link.href.startsWith("mailto:") ? undefined : "_blank"}
        >
          Open
          <ArrowRightFromSquare className="size-3.5" />
        </Link>
      </Card.Footer>
    </Card>
  );
}

