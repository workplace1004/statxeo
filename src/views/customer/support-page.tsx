"use client";

import type {
  CustomerSupportTicket,
  KnowledgeArticle,
} from "../../server/db/schemas/support-tickets";

import {ArrowUpRightFromSquare, Book, Comment, LifeRing} from "@gravity-ui/icons";
import {Button, Card, Chip, useOverlayState} from "@heroui/react";

import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {CUSTOMER_TICKET_STATUS_COLORS} from "../../server/db/schemas/support-tickets";
import {
  NewSupportTicketButton,
  NewSupportTicketModal,
} from "../../widgets/customer/modals/new-support-ticket-modal";
import {EmptyState} from "../../widgets/empty-state";

export interface CustomerSupportPageProps {
  tickets: CustomerSupportTicket[];
  articles: KnowledgeArticle[];
}

export function CustomerSupportPage({articles, tickets}: CustomerSupportPageProps) {
  const ticketState = useOverlayState();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted text-sm">
          Get help, browse guides, or chat with the StatXEO team.
        </p>
        <NewSupportTicketButton />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <Card.Header>
            <div className="bg-accent/10 text-accent mb-2 flex size-9 items-center justify-center rounded-xl">
              <Comment className="size-5" />
            </div>
            <Card.Title className="text-base">Live chat</Card.Title>
            <Card.Description>
              Average reply time: under 4 minutes during business hours.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button size="sm" onPress={() => notifySuccess("Live chat connected — say hello!")}>
              Start chat
            </Button>
          </Card.Footer>
        </Card>
        <Card className="rounded-2xl">
          <Card.Header>
            <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <LifeRing className="size-5" />
            </div>
            <Card.Title className="text-base">Submit a ticket</Card.Title>
            <Card.Description>
              For account-specific issues that need detailed investigation.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <NewSupportTicketButton label="New ticket" variant="tertiary" />
          </Card.Footer>
        </Card>
        <Card className="rounded-2xl">
          <Card.Header>
            <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
              <Book className="size-5" />
            </div>
            <Card.Title className="text-base">Knowledge base</Card.Title>
            <Card.Description>Guides on AI, SEO, calling, and more.</Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() =>
                window.open("https://docs.statxeo.com", "_blank", "noopener,noreferrer")
              }
            >
              Browse all
              <ArrowUpRightFromSquare className="size-3.5" />
            </Button>
          </Card.Footer>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Your tickets</Card.Title>
          <Card.Description>Open and recently resolved support tickets.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-2">
          {tickets.length === 0 ? (
            <EmptyState
              body="Need help? Open a ticket and the StatXEO team will jump in."
              cta={{label: "New ticket", onPress: ticketState.open}}
              icon={LifeRing}
              title="No tickets yet"
            />
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="hover:bg-content2 flex items-start justify-between gap-3 rounded-xl p-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-medium">{ticket.subject}</span>
                    <Chip
                      color={CUSTOMER_TICKET_STATUS_COLORS[ticket.status]}
                      size="sm"
                      variant="soft"
                    >
                      {ticket.status}
                    </Chip>
                  </div>
                  <span className="text-muted line-clamp-1 text-xs">{ticket.excerpt}</span>
                  <span className="text-muted text-xs">
                    Assigned to {ticket.assignee} · Last update {ticket.lastUpdate}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => notifyInfo(`Opening ticket “${ticket.subject}”`)}
                >
                  Open
                </Button>
              </div>
            ))
          )}
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Popular guides</Card.Title>
          <Card.Description>Most-read articles from the StatXEO knowledge base.</Card.Description>
        </Card.Header>
        <Card.Content>
          {articles.length === 0 ? (
            <EmptyState
              body="Help articles for using StatXEO will appear here."
              icon={Book}
              title="Articles coming soon"
            />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {articles.map((article) => (
                <button
                  key={article.id}
                  className="hover:bg-content2 flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left"
                  type="button"
                  onClick={() =>
                    notifyInfo(`Opening “${article.title}” in the knowledge base`)
                  }
                >
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">{article.title}</span>
                    <span className="text-muted text-xs">
                      {article.category} · {article.readMinutes} min read
                    </span>
                  </div>
                  <ArrowUpRightFromSquare className="text-muted size-4" />
                </button>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
      <NewSupportTicketModal state={ticketState} />
    </div>
  );
}
