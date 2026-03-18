"use client";

import { useState, useMemo } from "react";
import {
  Plus, Bookmark, FileText, Code2, LayoutGrid, Pin, PinOff,
  Pencil, Trash2, ExternalLink, Search, X, Loader2, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type CardType = "BOOKMARK" | "NOTE" | "CODE" | "OTHER";

interface SpaceCard {
  id: string;
  title: string;
  type: CardType;
  content: string | null;
  url: string | null;
  color: string;
  pinned: boolean;
  createdAt: string;
}

interface Props {
  initialCards: SpaceCard[];
}

const TYPE_CONFIG: Record<CardType, { label: string; icon: React.ElementType; bg: string; badge: string }> = {
  BOOKMARK: { label: "Bookmark", icon: Bookmark,   bg: "from-blue-500/10 to-blue-600/5",   badge: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  NOTE:     { label: "Note",     icon: FileText,    bg: "from-violet-500/10 to-violet-600/5", badge: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
  CODE:     { label: "Code",     icon: Code2,       bg: "from-emerald-500/10 to-emerald-600/5", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  OTHER:    { label: "Other",    icon: LayoutGrid,  bg: "from-amber-500/10 to-amber-600/5",  badge: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
};

const COLORS = ["#6366f1","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899","#8b5cf6","#06b6d4"];

const EMPTY = { title: "", type: "NOTE" as CardType, content: "", url: "", color: "#6366f1" };

export default function PersonalSpaceClient({ initialCards }: Props) {
  const { toast } = useToast();
  const [cards, setCards] = useState<SpaceCard[]>(initialCards);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<CardType | "ALL">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCard, setEditCard] = useState<SpaceCard | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Derived ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    return cards.filter((c) => {
      const matchType = filterType === "ALL" || c.type === filterType;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.content?.toLowerCase().includes(q) ||
        c.url?.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [cards, search, filterType]);

  const pinned   = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned);

  // ── Modal helpers ────────────────────────────────────────
  function openCreate() {
    setEditCard(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(card: SpaceCard) {
    setEditCard(card);
    setForm({ title: card.title, type: card.type, content: card.content || "", url: card.url || "", color: card.color });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditCard(null);
    setForm(EMPTY);
  }

  // ── CRUD ─────────────────────────────────────────────────
  async function handleSave() {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (form.type === "BOOKMARK" && form.url && !isValidUrl(form.url)) {
      toast({ title: "Enter a valid URL (include https://)", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, url: form.url || null, content: form.content || null };
      const res = editCard
        ? await fetch(`/api/space/${editCard.id}`, { method: "PUT",  headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/space",                  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      if (!res.ok) throw new Error();
      const saved: SpaceCard = await res.json();

      setCards((prev) =>
        editCard
          ? prev.map((c) => (c.id === saved.id ? saved : c))
          : [saved, ...prev]
      );
      toast({ title: editCard ? "✅ Card updated!" : "✅ Card created!" });
      closeModal();
    } catch {
      toast({ title: "Failed to save card", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/space/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setCards((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Card deleted" });
    } catch {
      toast({ title: "Failed to delete card", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTogglePin(card: SpaceCard) {
    try {
      const res = await fetch(`/api/space/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !card.pinned }),
      });
      if (!res.ok) throw new Error();
      const updated: SpaceCard = await res.json();
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch {
      toast({ title: "Failed to update pin", variant: "destructive" });
    }
  }

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // ── Render card ──────────────────────────────────────────
  function CardItem({ card }: { card: SpaceCard }) {
    const cfg = TYPE_CONFIG[card.type];
    const Icon = cfg.icon;
    const isDeleting = deletingId === card.id;

    return (
      <div
        className={cn(
          "group relative rounded-xl border border-border bg-gradient-to-br p-4 flex flex-col gap-3 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
          cfg.bg,
          card.pinned && "ring-1 ring-primary/30"
        )}
        style={{ borderTopColor: card.color + "40" }}
      >
        {/* Top row */}
        <div className="flex items-start gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: card.color + "20" }}>
            <Icon className="h-3.5 w-3.5" style={{ color: card.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight line-clamp-1">{card.title}</p>
          </div>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", cfg.badge)}>
            {cfg.label}
          </Badge>
        </div>

        {/* Content */}
        {card.type === "CODE" ? (
          <div className="relative">
            <pre className="rounded-lg bg-black/30 border border-border/50 p-3 text-[11px] font-mono text-emerald-300 overflow-auto max-h-32 whitespace-pre-wrap break-words">
              {card.content || "No code yet"}
            </pre>
            {card.content && (
              <button
                onClick={() => handleCopy(card.content!, card.id)}
                className="absolute top-2 right-2 p-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
              >
                {copiedId === card.id
                  ? <Check className="h-3 w-3 text-emerald-400" />
                  : <Copy className="h-3 w-3 text-muted-foreground" />
                }
              </button>
            )}
          </div>
        ) : card.type === "BOOKMARK" ? (
          <div className="space-y-1.5">
            {card.content && <p className="text-xs text-muted-foreground line-clamp-2">{card.content}</p>}
            {card.url && (
              <a
                href={card.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 truncate max-w-full"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{card.url.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
          </div>
        ) : (
          card.content && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {card.content}
            </p>
          )
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-[10px] text-muted-foreground">
            {new Date(card.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleTogglePin(card)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title={card.pinned ? "Unpin" : "Pin to top"}
            >
              {card.pinned
                ? <PinOff className="h-3.5 w-3.5 text-primary" />
                : <Pin className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>
            <button
              onClick={() => openEdit(card)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
            <button
              onClick={() => handleDelete(card.id)}
              disabled={isDeleting}
              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              {isDeleting
                ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                : <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Layout ───────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Personal Space</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your private collection of bookmarks, notes, and snippets
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> New Card
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards…"
            className="pl-8 h-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {(["ALL", "BOOKMARK", "NOTE", "CODE", "OTHER"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-3 h-9 rounded-lg text-xs font-medium border transition-all",
                filterType === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-border/80 text-muted-foreground"
              )}
            >
              {t === "ALL" ? "All" : TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {(["BOOKMARK","NOTE","CODE","OTHER"] as CardType[]).map((t) => {
          const count = cards.filter((c) => c.type === t).length;
          if (!count) return null;
          const cfg = TYPE_CONFIG[t];
          const Icon = cfg.icon;
          return (
            <div key={t} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs", cfg.badge)}>
              <Icon className="h-3 w-3" />
              {count} {cfg.label}{count !== 1 ? "s" : ""}
            </div>
          );
        })}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-2xl bg-muted/30 mb-4">
            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {search || filterType !== "ALL" ? "No cards match your filter" : "Your space is empty"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || filterType !== "ALL" ? "Try clearing filters" : "Add your first card to get started"}
          </p>
          {!search && filterType === "ALL" && (
            <Button onClick={openCreate} size="sm" variant="outline" className="mt-4">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Create card
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-3">
                <Pin className="h-3 w-3" /> Pinned
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pinned.map((c) => <CardItem key={c.id} card={c} />)}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <p className="text-xs font-medium text-muted-foreground mb-3">All cards</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unpinned.map((c) => <CardItem key={c.id} card={c} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCard ? "Edit Card" : "New Card"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Title */}
            <div>
              <Label className="text-xs">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Card title"
                className="mt-1.5 h-9 text-sm"
                autoFocus
              />
            </div>

            {/* Type */}
            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((p) => ({ ...p, type: v as CardType }))}
              >
                <SelectTrigger className="mt-1.5 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["BOOKMARK","NOTE","CODE","OTHER"] as CardType[]).map((t) => {
                    const cfg = TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    return (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" /> {cfg.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* URL for bookmarks */}
            {form.type === "BOOKMARK" && (
              <div>
                <Label className="text-xs">URL</Label>
                <Input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://example.com"
                  className="mt-1.5 h-9 text-sm font-mono"
                />
              </div>
            )}

            {/* Content */}
            <div>
              <Label className="text-xs">
                {form.type === "CODE" ? "Code Snippet" : form.type === "BOOKMARK" ? "Description (optional)" : "Content"}
              </Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                placeholder={
                  form.type === "CODE" ? "Paste your code here…" :
                  form.type === "BOOKMARK" ? "Add a description…" :
                  "Write your note…"
                }
                className={cn("mt-1.5 text-sm resize-none", form.type === "CODE" && "font-mono text-xs")}
                rows={form.type === "CODE" ? 6 : 4}
              />
            </div>

            {/* Color */}
            <div>
              <Label className="text-xs">Accent Color</Label>
              <div className="flex gap-2 mt-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((p) => ({ ...p, color: c }))}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                      form.color === c ? "border-white scale-110" : "border-transparent"
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Saving…</>
                  : editCard ? "Save Changes" : "Create Card"
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function isValidUrl(url: string) {
  try { new URL(url); return true; } catch { return false; }
}
