"use client";

import type {UseOverlayStateReturn} from "@heroui/react";

import {Megaphone, Picture, Xmark} from "@gravity-ui/icons";
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  Chip,
} from "@heroui/react";
import {useState, useCallback} from "react";

import {notifySuccess} from "@/lib/ui/white-label-notify";
import {ModalShell} from "@/lib/ui/modal-shell";

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "X", "Google"] as const;

export interface SocialComposerProps {
  trigger?: React.ReactNode;
  state: UseOverlayStateReturn;
}

export function SocialComposer({state, trigger}: SocialComposerProps) {
  const [brief, setBrief] = useState("");
  const [customer, setCustomer] = useState("");
  const [platform, setPlatform] = useState<string>("Instagram");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const [isDragActive, setIsDragActive] = useState(false);

  // Native Drag and Drop
  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const acceptedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    const newUrls = acceptedFiles.map(file => URL.createObjectURL(file));
    setMediaUrls(prev => [...prev, ...newUrls]);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const acceptedFiles = Array.from(e.target.files);
    const newUrls = acceptedFiles.map(file => URL.createObjectURL(file));
    setMediaUrls(prev => [...prev, ...newUrls]);
  }, []);

  const removeMedia = (indexToRemove: number) => {
    setMediaUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  async function handleGenerate(close: () => void) {
    if (!brief.trim()) return;

    try {
      const response = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer || "Acme Corp",
          platform: platform,
          status: "Draft",
          title: "AI Drafted Post",
          body: brief,
          mediaUrls: mediaUrls,
          scheduledFor: new Date(Date.now() + 86400000).toISOString(), // Schedule for tomorrow
          aiGenerated: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      notifySuccess(`Draft post queued for ${platform} — check the Draft column in a moment`);
      setBrief("");
      setCustomer("");
      setPlatform("Instagram");
      setMediaUrls([]);
      close();
    } catch (err) {
      console.error(err);
      notifySuccess("Failed to schedule post. Please check console.");
    }
  }

  // Cross-Platform Preview Character Limits
  const characterLimits: Record<string, number> = {
    "X": 280,
    "Instagram": 2200,
    "Facebook": 63206,
    "LinkedIn": 3000,
  };
  const limit = characterLimits[platform] || 2200;
  const isOverLimit = brief.length > limit;

  return (
    <ModalShell state={state} trigger={trigger}>
      <Modal.Container placement="center" size="lg">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Social Composer</Modal.Heading>
            <p className="text-muted text-sm">
              Draft, compose, and upload media across every channel.
            </p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-6 lg:flex-row">
            {/* Editor Pane */}
            <div className="flex flex-col gap-4 flex-1">
              <TextField name="post-customer" value={customer} onChange={setCustomer}>
                <Label>Customer</Label>
                <Input placeholder="Which customer is this for?" />
              </TextField>
              
              <Select
                className="w-full"
                name="post-platform"
                selectedKey={platform}
                onSelectionChange={(key) => setPlatform(String(key))}
              >
                <Label>Platform</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {PLATFORMS.map((p) => (
                      <ListBox.Item key={p} id={p} textValue={p}>
                        {p}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <TextField isRequired name="post-brief" value={brief} onChange={setBrief}>
                <div className="flex justify-between items-end">
                  <Label>Caption & Copy</Label>
                  <span className={`text-xs ${isOverLimit ? 'text-danger' : 'text-muted'}`}>
                    {brief.length} / {limit}
                  </span>
                </div>
                <TextArea
                  className="min-h-32 resize-y"
                  placeholder={`Write your ${platform} post here...`}
                />
              </TextField>

              {/* Drag and Drop Zone */}
              <div 
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-default-200 hover:border-primary/50 bg-content1 relative'}`}
              >
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*" 
                  onChange={onFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  aria-label="Upload media"
                />
                <Picture className="size-8 text-default-400 mb-2" />
                <p className="text-sm font-medium">Drag & drop media here</p>
                <p className="text-xs text-muted text-center mt-1">
                  Supports JPG, PNG, WEBP, MP4 (max 50MB)
                </p>
              </div>

              {/* Media Previews */}
              {mediaUrls.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative group rounded-md overflow-hidden border border-default-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Upload preview" className="h-16 w-16 object-cover" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeMedia(i); }}
                        className="absolute top-1 right-1 bg-black/60 p-0.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Xmark className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Preview Pane */}
            <div className="flex-1 border border-default-200 rounded-xl bg-content2 p-4 flex flex-col gap-3">
              <h4 className="text-sm font-semibold flex items-center justify-between">
                Live Preview
                <Chip size="sm" variant="soft">{platform}</Chip>
              </h4>
              <div className="bg-white dark:bg-black rounded-lg border border-default-200 p-4 shadow-sm flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <div className="size-10 bg-default-200 rounded-full flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{customer || "Acme Corp"}</span>
                    <span className="text-xs text-default-400">Sponsored</span>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                  {brief || "Start typing to see your live preview..."}
                </p>
                {mediaUrls.length > 0 && (
                  <div className="rounded-lg overflow-hidden border border-default-100 bg-default-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrls[0]} alt="Post media" className="w-full h-auto max-h-64 object-cover" />
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="tertiary">
              Cancel
            </Button>
            <Button isDisabled={!brief.trim() || isOverLimit} onPress={() => handleGenerate(state.close)} variant="primary">
              <Megaphone className="size-4" />
              Schedule Post
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </ModalShell>
  );
}
