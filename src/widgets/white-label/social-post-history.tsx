"use client";

import type {SocialPostAgency} from "@/server/db/schemas/social-posts";

import {Card, Chip, Table} from "@heroui/react";
import {Heart, Comment, ArrowShapeTurnUpRight, CircleCheck, CircleDashed} from "@gravity-ui/icons";

import {SOCIAL_STATUS_COLOR} from "@/server/db/schemas/social-posts";

export interface SocialPostHistoryProps {
  posts: SocialPostAgency[];
}

export function SocialPostHistory({posts}: SocialPostHistoryProps) {
  // Only show posts that are not in Draft or Awaiting Approval
  const historyPosts = posts.filter(
    (p) => p.status === "Published" || p.status === "Failed" || p.status === "Scheduled"
  );

  return (
    <Card className="rounded-2xl">
      <Card.Header>
        <div className="flex flex-col">
          <Card.Title className="text-base">Publishing History</Card.Title>
          <Card.Description>Audit log of recent automated publications and engagement.</Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="px-0 pb-0">
        {historyPosts.length === 0 ? (
          <div className="p-6 text-center">
            <CircleDashed className="size-8 text-default-300 mx-auto mb-2" />
            <p className="text-sm text-muted">No published or scheduled posts yet.</p>
          </div>
        ) : (
          <Table aria-label="Social Post History" className="rounded-none shadow-none">
            <Table.Header>
              <Table.Column>Customer</Table.Column>
              <Table.Column>Platform</Table.Column>
              <Table.Column>Status</Table.Column>
              <Table.Column>Engagement</Table.Column>
              <Table.Column>Scheduled For</Table.Column>
            </Table.Header>
            <Table.Body>
              {historyPosts.map((post) => (
                <Table.Row key={post.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{post.customer}</span>
                        <span className="text-xs text-muted truncate max-w-[150px]">
                          {post.caption}
                        </span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip size="sm" variant="soft">
                      {post.platform}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip size="sm" color={SOCIAL_STATUS_COLOR[post.status] || "default"} variant="soft">
                      {post.status}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell>
                    {post.status === "Published" ? (
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Heart className="size-3" /> {post.engagement}
                        </span>
                        <span className="flex items-center gap-1">
                          <Comment className="size-3" /> 0
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowShapeTurnUpRight className="size-3" /> 0
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-xs text-muted">
                    {new Date(post.scheduledFor).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit"
                    })}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card.Content>
    </Card>
  );
}
