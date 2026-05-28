import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
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

type CategoryItem = {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  slug?: string | null;
  productCount?: number | null;
  products?: unknown[] | null;
};

type CategoryFormState = {
  name: string;
  description: string;
  icon: string;
  slug: string;
};

const defaultForm: CategoryFormState = {
  name: "",
  description: "",
  icon: "",
  slug: "",
};

const VI_MAP: Record<string, string> = {
  à: "a", á: "a", ả: "a", ã: "a", ạ: "a",
  ă: "a", ằ: "a", ắ: "a", ẳ: "a", ẵ: "a", ặ: "a",
  â: "a", ầ: "a", ấ: "a", ẩ: "a", ẫ: "a", ậ: "a",
  è: "e", é: "e", ẻ: "e", ẽ: "e", ẹ: "e",
  ê: "e", ề: "e", ế: "e", ể: "e", ễ: "e", ệ: "e",
  ì: "i", í: "i", ỉ: "i", ĩ: "i", ị: "i",
  ò: "o", ó: "o", ỏ: "o", õ: "o", ọ: "o",
  ô: "o", ồ: "o", ố: "o", ổ: "o", ỗ: "o", ộ: "o",
  ơ: "o", ờ: "o", ớ: "o", ở: "o", ỡ: "o", ợ: "o",
  ù: "u", ú: "u", ủ: "u", ũ: "u", ụ: "u",
  ư: "u", ừ: "u", ứ: "u", ử: "u", ữ: "u", ự: "u",
  ỳ: "y", ý: "y", ỷ: "y", ỹ: "y", ỵ: "y",
  đ: "d",
};

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/g, (c) => VI_MAP[c] ?? c)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const PASTELS = [
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
];

export const Route = createFileRoute("/_authed/categories")({
  head: () => ({ meta: [{ title: "Danh mục — HappyMall Admin" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState<CategoryFormState>(defaultForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<CategoryItem | null>(null);

  const q = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<CategoryItem[]>("/categories", { auth: false }),
  });
  const list = q.data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; body: Record<string, unknown> }) =>
      apiFetch(payload.id ? `/categories/${payload.id}` : "/categories", {
        method: payload.id ? "PATCH" : "POST",
        body: JSON.stringify(payload.body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(editing ? "Cập nhật danh mục thành công" : "Tạo danh mục thành công");
      setDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);
      setFormError("");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Lưu danh mục thất bại";
      setFormError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Xóa danh mục thành công");
      setDeleting(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Xóa danh mục thất bại";
      toast.error(message);
    },
  });

  function getProductCount(category: CategoryItem) {
    if (category.productCount != null) return Number(category.productCount);
    if (category.products) return category.products.length;
    return 0;
  }

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setSlugTouched(false);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(category: CategoryItem) {
    setEditing(category);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
      icon: category.icon ?? category.image ?? "",
      slug: category.slug ?? "",
    });
    setSlugTouched(true);
    setFormError("");
    setDialogOpen(true);
  }

  function validateForm() {
    if (!form.name.trim()) return "Tên danh mục là bắt buộc";
    if (!form.description.trim()) return "Mô tả danh mục là bắt buộc";
    return "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon.trim() || undefined,
      slug: form.slug.trim() || undefined,
    };
    setFormError("");
    saveMutation.mutate({ id: editing?.id, body: payload });
  }

  return (
    <div>
      <PageHeader
        title="Danh mục"
        subtitle={`${list.length} danh mục`}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Thêm danh mục
          </Button>
        }
      />

      {q.isLoading || q.isError || list.length === 0 ? (
        <DataState loading={q.isLoading} error={q.error} empty={list.length === 0} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {list.map((c, idx) => {
            const products = getProductCount(c);
            const canDelete = products === 0;
            return (
              <div
                key={c.id}
                className="rounded-2xl bg-card p-4 text-center shadow-[var(--shadow-card)] transition hover:shadow-md"
              >
                <button className="w-full" onClick={() => openEdit(c)}>
                  <div
                    className={`mx-auto grid size-16 place-items-center rounded-2xl ${PASTELS[idx % PASTELS.length]}`}
                  >
                    {c.icon || c.image ? (
                      <img
                        src={c.icon ?? c.image ?? ""}
                        alt={c.name}
                        className="size-10 object-contain"
                      />
                    ) : (
                      <Tag className="size-7" />
                    )}
                  </div>
                  <div className="mt-3 min-w-0">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {c.description ?? "Không có mô tả"}
                    </p>
                    <p className="text-xs text-muted-foreground">{products} sản phẩm</p>
                  </div>
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  disabled={deleteMutation.isPending}
                  onClick={() => setDeleting(c)}
                >
                  <Trash2 className="size-4" />
                  Xóa
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật danh mục" : "Thêm danh mục"}</DialogTitle>
            <DialogDescription>Điền thông tin danh mục và lưu thay đổi.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="category-name">Tên danh mục *</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name,
                    slug: slugTouched ? prev.slug : toSlug(name),
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Mô tả *</Label>
              <Textarea
                id="category-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-icon">Icon URL</Label>
              <Input
                id="category-icon"
                value={form.icon}
                onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-slug">
                Slug{!slugTouched && !editing && <span className="ml-1 text-xs text-muted-foreground">(tự động)</span>}
              </Label>
              <Input
                id="category-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
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
            <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Danh mục <strong>{deleting?.name}</strong> sẽ bị xóa khỏi hệ thống.
                </p>
                {deleting && getProductCount(deleting) > 0 && (
                  <p className="text-amber-600 font-medium">
                    Cảnh báo: danh mục này đang có {getProductCount(deleting)} sản phẩm. Các sản phẩm đó sẽ không còn thuộc danh mục nào sau khi xóa.
                  </p>
                )}
              </div>
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
