"use client";

import type {
  AffiliateSupportTicket,
  FaqItem,
  KnowledgeArticle,
} from "../../server/db/schemas/support-tickets";

import {Book, LifeRing} from "@gravity-ui/icons";
import {Accordion, Button, Card, Chip} from "@heroui/react";

import {notifyInfo} from "../../lib/ui/white-label-notify";
import {AFFILIATE_TICKET_STATUS_COLORS} from "../../server/db/schemas/support-tickets";
import {NewSupportTicketButton} from "../../widgets/affiliate/modals/new-support-ticket-modal";
import {EmptyState} from "../../widgets/empty-state";

export interface AffiliateSupportPageProps {
  tickets: AffiliateSupportTicket[];
  faqs: FaqItem[];
  articles: KnowledgeArticle[];
}

export function AffiliateSupportPage({articles, faqs, tickets}: AffiliateSupportPageProps) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 pb-10 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted text-sm">
          Get help fast — search the docs, ping your manager, or open a ticket.
        </p>
        <NewSupportTicketButton />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <Card.Header className="flex-row items-start gap-3">
            <div className="bg-accent-soft text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
              <LifeRing className="size-5" />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Card.Title className="text-base">Your partner manager</Card.Title>
              <Card.Description>
                Your partner manager will be assigned once your application is approved.
              </Card.Description>
            </div>
          </Card.Header>
          <Card.Footer>
            <Button isDisabled size="sm" variant="secondary">
              Pending assignment
            </Button>
          </Card.Footer>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header>
            <div className="bg-accent-soft text-accent flex size-10 items-center justify-center rounded-xl">
              <Book className="size-5" />
            </div>
            <Card.Title className="text-base">Affiliate docs</Card.Title>
            <Card.Description>
              Playbooks, tracking specs, and best practices to grow your book.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => window.open("https://docs.statxeo.com/affiliates", "_blank", "noopener,noreferrer")}
            >
              Browse docs
            </Button>
          </Card.Footer>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header>
            <div className="bg-success-soft text-success flex size-10 items-center justify-center rounded-xl">
              <LifeRing className="size-5" />
            </div>
            <Card.Title className="text-base">Partner community</Card.Title>
            <Card.Description>
              Trade tips with other StatXEO affiliates in the Slack community.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => window.open("https://statxeo.com/community", "_blank", "noopener,noreferrer")}
            >
              Join community
            </Button>
          </Card.Footer>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Your tickets</Card.Title>
          <Card.Description>Track open conversations with the StatXEO team.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-2">
          {tickets.length === 0 ? (
            <EmptyState
              body="Open a ticket below and our partner team will jump in."
              cta={{label: "New ticket", onPress: () => notifyInfo("Use New ticket above")}}
              title="No support tickets yet"
            />
          ) : (
            tickets.map((tk) => (
              <div
                key={tk.id}
                className="border-content2 bg-content1 flex flex-col gap-1 rounded-xl border p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground text-sm font-semibold tabular-nums">
                    {tk.reference}
                  </span>
                  <Chip color={AFFILIATE_TICKET_STATUS_COLORS[tk.status]} size="sm" variant="soft">
                    {tk.status}
                  </Chip>
                  <Chip color="default" size="sm" variant="soft">
                    {tk.category}
                  </Chip>
                  <span className="text-muted ml-auto text-xs">{tk.updatedAt}</span>
                </div>
                <span className="text-foreground text-sm font-medium">{tk.subject}</span>
                <span className="text-muted text-xs">{tk.lastMessage}</span>
              </div>
            ))
          )}
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Frequently asked questions</Card.Title>
          <Card.Description>The answers we give most often, ready when you are.</Card.Description>
        </Card.Header>
        <Card.Content>
          {faqs.length === 0 ? (
            <EmptyState
              body="Common questions from partners will appear here."
              title="FAQs coming soon"
            />
          ) : (
            <Accordion className="w-full">
              {faqs.map((faq) => (
                <Accordion.Item key={faq.id} id={faq.id}>
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
            <Card.Description>Deeper guides curated for affiliate partners.</Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-2">
            {articles.map((article) => (
              <div
                key={article.id}
                className="border-content2 bg-content1 flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="text-foreground truncate text-sm font-medium">
                    {article.title}
                  </span>
                  <span className="text-muted truncate text-xs">{article.category}</span>
                </div>
                <span className="text-muted text-xs tabular-nums">
                  {article.readMinutes} min read
                </span>
              </div>
            ))}
          </Card.Content>
        </Card>
      ) : null}
    </div>
  );
}
