import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, Package, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatVnd } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

type ProductsSearch = {
  search: string;
  categoryId: string;
  page: number;
};

type CategoryItem = {
  id: string;
  name: string;
};

type ProductItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock?: number | null;
  oldPrice?: number | null;
  image?: string | null;
  imageUrl?: string | null;
  images?: string[] | null;
  categoryId?: string | null;
  rank?: number | null;
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  oldPrice: string;
  imageUrl: string;
  categoryId: string;
  rank: string;
};

const productsSearchSchema = z.object({
  search: fallback(z.string(), "").default(""),
  categoryId: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
});

const defaultForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
  oldPrice: "",
  imageUrl: "",
  categoryId: "",
  rank: "",
};

export const Route = createFileRoute("/_authed/products")({
  head: () => ({ meta: [{ title: "Sản phẩm — HappyMall Admin" }] }),
  validateSearch: zodValidator(productsSearchSchema),
  component: ProductsPage,
});

function ProductsPage() {
  const { search, categoryId, page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const limit = 20;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [form, setForm] = useState<ProductFormState>(defaultForm);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<ProductItem | null>(null);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<CategoryItem[]>("/categories", { auth: false }),
  });

  const products = useQuery({
    queryKey: ["products", { search, categoryId, page }],
    queryFn: () =>
      apiFetch<ProductItem[]>("/products", {
        auth: false,
        query: { search, categoryId: categoryId || undefined, page, limit },
      }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; body: Record<string, unknown> }) =>
      apiFetch(payload.id ? `/products/${payload.id}` : "/products", {
        method: payload.id ? "PATCH" : "POST",
        body: JSON.stringify(payload.body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(editing ? "Cập nhật sản phẩm thành công" : "Tạo sản phẩm thành công");
      setDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);
      setFormError("");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Lưu sản phẩm thất bại";
      setFormError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/products/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Xóa sản phẩm thành công");
      setDeleting(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Xóa sản phẩm thất bại";
      toast.error(message);
    },
  });

  const list = products.data?.data ?? [];
  const total = products.data?.meta?.total ?? list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilter = search || categoryId;

  const editingImage = useMemo(
    () => editing?.imageUrl ?? editing?.image ?? editing?.images?.[0] ?? "",
    [editing],
  );

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(product: ProductItem) {
    setEditing(product);
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
      oldPrice: product.oldPrice == null ? "" : String(product.oldPrice),
      imageUrl: product.imageUrl ?? product.image ?? product.images?.[0] ?? "",
      categoryId: product.categoryId ?? "",
      rank: product.rank == null ? "" : String(product.rank),
    });
    setFormError("");
    setDialogOpen(true);
  }

  function validateForm() {
    if (!form.name.trim()) return "Tên sản phẩm là bắt buộc";
    if (!form.description.trim()) return "Mô tả sản phẩm là bắt buộc";
    if (!form.price.trim()) return "Giá sản phẩm là bắt buộc";
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) return "Giá sản phẩm phải lớn hơn 0";
    if (!form.stock.trim()) return "Số lượng tồn kho là bắt buộc";
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) return "Tồn kho phải là số nguyên không âm";
    if (form.oldPrice.trim()) {
      const oldPrice = Number(form.oldPrice);
      if (!Number.isFinite(oldPrice) || oldPrice < 0) return "Giá cũ không hợp lệ";
    }
    if (form.rank.trim()) {
      const rank = Number(form.rank);
      if (!Number.isInteger(rank) || rank < 0) return "Thứ hạng phải là số nguyên không âm";
    }
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
      price: Number(form.price),
      stock: Number(form.stock),
      oldPrice: form.oldPrice.trim() ? Number(form.oldPrice) : undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      categoryId: form.categoryId || undefined,
      rank: form.rank.trim() ? Number(form.rank) : undefined,
    };
    setFormError("");
    saveMutation.mutate({ id: editing?.id, body: payload });
  }

  return (
    <div>
      <PageHeader
        title="Sản phẩm"
        subtitle={`${total} sản phẩm đang hoạt động`}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Thêm sản phẩm
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) =>
              navigate({
                search: (prev: ProductsSearch) => ({ ...prev, search: e.target.value, page: 1 }),
              })
            }
            placeholder="Tìm theo tên sản phẩm..."
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) =>
            navigate({
              search: (prev: ProductsSearch) => ({ ...prev, categoryId: e.target.value, page: 1 }),
            })
          }
          className="h-11 min-w-[180px] rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="">Tất cả danh mục</option>
          {(categories.data?.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {hasFilter ? (
          <button
            onClick={() => navigate({ search: { search: "", categoryId: "", page: 1 } })}
            className="inline-flex h-11 items-center gap-1 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            <X className="size-4" /> Xóa lọc
          </button>
        ) : null}
      </div>

      {products.isLoading || products.isError || list.length === 0 ? (
        <DataState
          loading={products.isLoading}
          error={products.error}
          empty={list.length === 0}
          emptyText="Không có sản phẩm nào"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {list.map((p) => {
              const preview = p.imageUrl ?? p.image ?? p.images?.[0];
              return (
                <div
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {preview ? (
                      <img
                        src={preview}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">
                        <Package className="size-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="min-h-[2.5rem] text-sm font-medium line-clamp-2">{p.name}</p>
                    <div className="mt-auto flex items-baseline justify-between gap-2 pt-2">
                      <span className="text-base font-bold text-primary">{formatVnd(p.price)}</span>
                      {p.rank != null ? (
                        <span className="text-xs text-muted-foreground">#{p.rank}</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">Tồn kho: {p.stock ?? 0}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEdit(p)}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setDeleting(p)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination page={page} totalPages={totalPages} />
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</DialogTitle>
            <DialogDescription>Điền thông tin sản phẩm và lưu thay đổi.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="product-name">Tên sản phẩm *</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ví dụ: Táo Envy"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Mô tả *</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="product-price">Giá bán *</Label>
                <Input
                  id="product-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-stock">Tồn kho *</Label>
                <Input
                  id="product-stock"
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-image">Image URL</Label>
              <Input
                id="product-image"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
              {editingImage ? (
                <p className="text-xs text-muted-foreground">Ảnh hiện tại: {editingImage}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="product-category">Danh mục</Label>
                <select
                  id="product-category"
                  value={form.categoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Không chọn</option>
                  {(categories.data?.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-rank">Thứ hạng</Label>
                <Input
                  id="product-rank"
                  type="number"
                  min={0}
                  value={form.rank}
                  onChange={(e) => setForm((prev) => ({ ...prev, rank: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-old-price">Giá cũ</Label>
              <Input
                id="product-old-price"
                type="number"
                min={0}
                value={form.oldPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, oldPrice: e.target.value }))}
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
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Sản phẩm <strong>{deleting?.name}</strong> sẽ bị xóa. Hành động này không thể hoàn
              tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending || !deleting}
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

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const window = 2;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
      <Link
        from={Route.fullPath}
        search={(prev: ProductsSearch) => ({ ...prev, page: Math.max(1, page - 1) })}
        className="h-9 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50"
        aria-disabled={page === 1}
      >
        Trước
      </Link>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            from={Route.fullPath}
            search={(prev: ProductsSearch) => ({ ...prev, page: p })}
            className={`grid h-9 min-w-9 place-items-center rounded-lg px-3 text-sm font-medium ${
              p === page
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-button)]"
                : "border border-input bg-card hover:bg-muted"
            }`}
          >
            {p}
          </Link>
        ),
      )}
      <Link
        from={Route.fullPath}
        search={(prev: ProductsSearch) => ({ ...prev, page: Math.min(totalPages, page + 1) })}
        className="h-9 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50"
        aria-disabled={page >= totalPages}
      >
        Sau
      </Link>
    </div>
  );
}
