import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Newspaper, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatDateShort } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type NewsCategory = "promo" | "knowledge";

type NewsItem = {
  id: string;
  title: string;
  category: NewsCategory;
  coverUrl?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  excerpt?: string | null;
  summary?: string | null;
  description?: string | null;
  content?: string[] | string | null;
  tag?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
};

type NewsFormState = {
  id: string;
  title: string;
  category: NewsCategory;
  thumbnail: string;
  excerpt: string;
  content: string;
  tag: string;
};

const CATS: { value: "" | NewsCategory; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "promo", label: "Khuyến mãi" },
  { value: "knowledge", label: "Kiến thức" },
];

const defaultForm: NewsFormState = {
  id: "",
  title: "",
  category: "promo",
  thumbnail: "",
  excerpt: "",
  content: "",
  tag: "",
};

export const Route = createFileRoute("/_authed/news")({
  head: () => ({ meta: [{ title: "Tin tức — HappyMall Admin" }] }),
  component: NewsPage,
});

function NewsPage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<"" | NewsCategory>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState<NewsFormState>(defaultForm);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<NewsItem | null>(null);

  const q = useQuery({
    queryKey: ["news", category],
    queryFn: () =>
      apiFetch<NewsItem[]>("/news", { auth: false, query: { category: category || undefined } }),
  });
  const list = q.data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; body: Record<string, unknown> }) =>
      apiFetch(payload.id ? `/news/${payload.id}` : "/news", {
        method: payload.id ? "PATCH" : "POST",
        body: JSON.stringify(payload.body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["news"] });
      toast.success(editing ? "Cập nhật bài viết thành công" : "Viết bài thành công");
      setDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);
      setFormError("");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Lưu bài viết thất bại";
      setFormError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/news/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["news"] });
      toast.success("Xóa bài viết thành công");
      setDeleting(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Xóa bài viết thất bại";
      toast.error(message);
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(item: NewsItem) {
    setEditing(item);
    const content = Array.isArray(item.content) ? item.content.join("\n") : (item.content ?? "");
    setForm({
      id: item.id ?? "",
      title: item.title ?? "",
      category: item.category ?? "promo",
      thumbnail: item.thumbnail ?? item.coverUrl ?? item.image ?? "",
      excerpt: item.excerpt ?? item.summary ?? item.description ?? "",
      content,
      tag: item.tag ?? "",
    });
    setFormError("");
    setDialogOpen(true);
  }

  function validateForm() {
    if (!form.title.trim()) return "Tiêu đề bài viết là bắt buộc";
    if (!form.category) return "Danh mục bài viết là bắt buộc";
    const blocks = form.content
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    if (blocks.length === 0) return "Nội dung bài viết không được để trống";
    return "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    const content = form.content
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const payload: Record<string, unknown> = {
      id: form.id.trim() || undefined,
      title: form.title.trim(),
      category: form.category,
      thumbnail: form.thumbnail.trim() || undefined,
      excerpt: form.excerpt.trim() || undefined,
      content,
      tag: form.tag.trim() || undefined,
    };
    setFormError("");
    saveMutation.mutate({ id: editing?.id, body: payload });
  }

  return (
    <div>
      <PageHeader
        title="Tin tức"
        subtitle={`${list.length} bài viết`}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Viết bài
          </Button>
        }
      />

      <div className="mb-5 flex gap-2">
        {CATS.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`h-9 rounded-full px-4 text-sm font-medium transition ${
              category === c.value
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-button)]"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {q.isLoading || q.isError || list.length === 0 ? (
        <DataState loading={q.isLoading} error={q.error} empty={list.length === 0} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((n) => (
            <article
              key={n.id}
              className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] transition hover:shadow-md"
            >
              <button className="w-full text-left" onClick={() => openEdit(n)}>
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  {n.coverUrl || n.image || n.thumbnail ? (
                    <img
                      src={n.coverUrl ?? n.image ?? n.thumbnail ?? ""}
                      alt={n.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <Newspaper className="size-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="inline-flex w-fit rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    {n.category === "promo"
                      ? "Khuyến mãi"
                      : n.category === "knowledge"
                        ? "Kiến thức"
                        : n.category}
                  </span>
                  <h3 className="mt-2 line-clamp-2 font-semibold">{n.title}</h3>
                  <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {n.excerpt ?? n.summary ?? n.description ?? ""}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {formatDateShort(n.publishedAt ?? n.createdAt)}
                  </p>
                </div>
              </button>
              <div className="px-4 pb-4">
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleting(n)}
                >
                  <Trash2 className="size-4" />
                  Xóa bài viết
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật bài viết" : "Viết bài mới"}</DialogTitle>
            <DialogDescription>Điền thông tin và nội dung bài viết.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="news-id">Mã bài viết</Label>
                <Input
                  id="news-id"
                  value={form.id}
                  disabled={Boolean(editing)}
                  onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="news-summer-sale"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="news-category">Danh mục *</Label>
                <select
                  id="news-category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value as NewsCategory }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="promo">Khuyến mãi</option>
                  <option value="knowledge">Kiến thức</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-title">Tiêu đề *</Label>
              <Input
                id="news-title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-thumbnail">Thumbnail URL</Label>
              <Input
                id="news-thumbnail"
                value={form.thumbnail}
                onChange={(e) => setForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-excerpt">Excerpt</Label>
              <Textarea
                id="news-excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-content">Nội dung * (mỗi dòng là một block)</Label>
              <Textarea
                id="news-content"
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="news-tag">Tag</Label>
              <Input
                id="news-tag"
                value={form.tag}
                onChange={(e) => setForm((prev) => ({ ...prev, tag: e.target.value }))}
                placeholder="flash-sale"
              />
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài viết <strong>{deleting?.title}</strong> sẽ bị xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleting || deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
