"use client";

import type {ReactNode} from "react";

import {ArrowsRotateLeft, Calendar, ChevronDown} from "@gravity-ui/icons";
import {Button, ButtonGroup, Dropdown, Label} from "@heroui/react";

import {IconButton} from "../components/icon-button";

export interface PageToolbarProps {
  title?: string;
  description?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  showPeriod?: boolean;
}

export function PageToolbar({
  description,
  leading,
  showPeriod = true,
  title,
  trailing,
}: PageToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        {title ? (
          <h1 className="text-foreground truncate text-xl font-semibold">{title}</h1>
        ) : null}
        {description ? <p className="text-muted text-sm">{description}</p> : null}
        {leading}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {trailing}
        {showPeriod ? (
          <>
            <IconButton label="Refresh" size="sm" variant="tertiary">
              <ArrowsRotateLeft className="size-4" />
            </IconButton>
            <ButtonGroup size="sm" variant="tertiary">
              <Button>
                <Calendar className="size-4" />
                Last 30 days
              </Button>
              <Dropdown>
                <Button isIconOnly aria-label="Change period" size="sm" variant="tertiary">
                  <ChevronDown className="size-4" />
                </Button>
                <Dropdown.Popover placement="bottom end">
                  <Dropdown.Menu>
                    <Dropdown.Item id="7d" textValue="Last 7 days">
                      <Label>Last 7 days</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="30d" textValue="Last 30 days">
                      <Label>Last 30 days</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="90d" textValue="Last 90 days">
                      <Label>Last 90 days</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="12m" textValue="Last 12 months">
                      <Label>Last 12 months</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </ButtonGroup>
          </>
        ) : null}
      </div>
    </div>
  );
}
