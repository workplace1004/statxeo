"use client";

import type {ReactNode} from "react";

import {ChartLine, FileText, MagicWand, PersonPlus, Sparkles, Target} from "@gravity-ui/icons";
import {useOverlayState} from "@heroui/react";
import {motion} from "motion/react";
import Link from "next/link";

import {GeneratePageModal} from "./modals/generate-page-modal";
import {GeneratePostModal} from "./modals/generate-post-modal";
import {InviteTeamMemberModal} from "./modals/invite-team-member-modal";
import {TrackKeywordModal} from "./modals/track-keyword-modal";

function TileContent({
  count,
  icon,
  iconClass,
  label,
}: {
  icon: ReactNode;
  label: string;
  iconClass: string;
  count?: number;
}) {
  return (
    <div className="bg-content1 border-default hover:bg-content2 relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors">
      <div className={`flex size-9 items-center justify-center rounded-xl ${iconClass}`}>
        {icon}
      </div>
      <span className="text-foreground text-xs font-medium leading-tight">{label}</span>
      {count !== undefined && count > 0 ? (
        <span className="bg-accent absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums text-white">
          {count}
        </span>
      ) : null}
    </div>
  );
}

const TILE_MOTION = {
  initial: {opacity: 0, y: 8},
  viewport: {once: true},
  whileHover: {scale: 1.04, y: -2},
  whileTap: {scale: 0.97},
};

export interface QuickActionsStripProps {
  pendingAiCount?: number;
}

export function QuickActionsStrip({pendingAiCount = 0}: QuickActionsStripProps) {
  const postState = useOverlayState();
  const pageState = useOverlayState();
  const keywordState = useOverlayState();
  const inviteState = useOverlayState();

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <motion.button
          {...TILE_MOTION}
          className="block w-full text-left"
          transition={{duration: 0.2, delay: 0}}
          type="button"
          whileInView={{opacity: 1, y: 0}}
          onClick={postState.open}
        >
          <TileContent
            icon={<Sparkles className="size-4" />}
            iconClass="bg-accent/10 text-accent"
            label="Generate post"
          />
        </motion.button>

        <motion.button
          {...TILE_MOTION}
          className="block w-full text-left"
          transition={{duration: 0.2, delay: 0.04}}
          type="button"
          whileInView={{opacity: 1, y: 0}}
          onClick={pageState.open}
        >
          <TileContent
            icon={<FileText className="size-4" />}
            iconClass="bg-sky-500/10 text-sky-600"
            label="Create page"
          />
        </motion.button>

        <motion.button
          {...TILE_MOTION}
          className="block w-full text-left"
          transition={{duration: 0.2, delay: 0.08}}
          type="button"
          whileInView={{opacity: 1, y: 0}}
          onClick={keywordState.open}
        >
          <TileContent
            icon={<Target className="size-4" />}
            iconClass="bg-emerald-500/10 text-emerald-600"
            label="Track keyword"
          />
        </motion.button>

        <Link className="block" href="/customer/ai">
          <motion.div {...TILE_MOTION} transition={{duration: 0.2, delay: 0.12}} whileInView={{opacity: 1, y: 0}}>
            <TileContent
              count={pendingAiCount}
              icon={<MagicWand className="size-4" />}
              iconClass="bg-violet-500/10 text-violet-600"
              label="Review AI tasks"
            />
          </motion.div>
        </Link>

        <Link className="block" href="/customer/analytics">
          <motion.div {...TILE_MOTION} transition={{duration: 0.2, delay: 0.16}} whileInView={{opacity: 1, y: 0}}>
            <TileContent
              icon={<ChartLine className="size-4" />}
              iconClass="bg-amber-500/10 text-amber-600"
              label="View analytics"
            />
          </motion.div>
        </Link>

        <motion.button
          {...TILE_MOTION}
          className="block w-full text-left"
          transition={{duration: 0.2, delay: 0.2}}
          type="button"
          whileInView={{opacity: 1, y: 0}}
          onClick={inviteState.open}
        >
          <TileContent
            icon={<PersonPlus className="size-4" />}
            iconClass="bg-pink-500/10 text-pink-600"
            label="Invite team"
          />
        </motion.button>
      </div>

      {/* Modals — controlled headlessly via external state */}
      <GeneratePostModal state={postState} />
      <GeneratePageModal state={pageState} />
      <TrackKeywordModal state={keywordState} />
      <InviteTeamMemberModal state={inviteState} />
    </>
  );
}
