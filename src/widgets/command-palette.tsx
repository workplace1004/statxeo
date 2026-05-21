"use client";

import type {NavItem} from "../shared/nav-types";

import {Magnifier} from "@gravity-ui/icons";
import {Chip, Modal} from "@heroui/react";
import {useRouter} from "next/navigation";
import {useEffect, useRef, useState} from "react";

export interface CommandPaletteProps {
  navItems: NavItem[];
  footerItems: NavItem[];
  basePath: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({
  footerItems,
  isOpen,
  navItems,
  onClose,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = [...navItems, ...footerItems];

  const results =
    query.trim() === ""
      ? allItems
      : allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  // Reset and focus when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      const id = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  // Clamp selected index when results shrink
  useEffect(() => {
    if (selectedIndex >= results.length) {
      setSelectedIndex(Math.max(0, results.length - 1));
    }
  }, [results.length, selectedIndex]);

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[selectedIndex];
      if (item) navigate(item.href);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Container placement="center" size="md" className="sm:mt-16 sm:items-start">
        <Modal.Dialog>
          <div className="flex flex-col overflow-hidden rounded-2xl">
            {/* Search bar */}
            <div className="border-default/60 flex items-center gap-3 border-b px-4 py-3">
              <Magnifier className="text-muted size-4 shrink-0" />
              <input
                ref={inputRef}
                className="text-foreground placeholder:text-muted flex-1 bg-transparent text-sm outline-none"
                placeholder="Search pages and actions…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
              />
              <Chip size="sm" variant="soft">
                ESC
              </Chip>
            </div>

            {/* Results list */}
            <div className="max-h-72 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="text-muted py-8 text-center text-sm">
                  No results for &ldquo;{query}&rdquo;
                </p>
              ) : (
                results.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={item.href}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-accent/10 text-accent"
                          : "text-foreground hover:bg-content2"
                      }`}
                      type="button"
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge ? (
                        <Chip className="ml-auto" size="sm" variant="soft">
                          {item.badge}
                        </Chip>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer hints */}
            <div className="border-default/60 flex items-center gap-4 border-t px-4 py-2">
              <span className="text-muted text-xs">↑↓ navigate</span>
              <span className="text-muted text-xs">↵ open</span>
              <span className="text-muted ml-auto text-xs">⌘K to toggle</span>
            </div>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
