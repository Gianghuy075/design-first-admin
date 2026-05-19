import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatVnd } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Search, Package, X } from "lucide-react";

type ProductsSearch = {
  search: string;
  categoryId: string;
  page: number;
};

const productsSearchSchema = z.object({
  search: fallback(z.string(), "").default(""),
  categoryId: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/_authed/products")({
  head: () => ({ meta: [{ title: "Sản phẩm — HappyMall Admin" }] }),
  validateSearch: zodValidator(productsSearchSchema),
  component: ProductsPage,
});

function ProductsPage() {
  const { search, categoryId, page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const limit = 20;

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<any[]>("/categories", { auth: false }),
  });

  const products = useQuery({
    queryKey: ["products", { search, categoryId, page }],
    queryFn: () =>
      apiFetch<any[]>("/products", {
        auth: false,
        query: { search, categoryId: categoryId || undefined, page, limit },
      }),
  });

  const list = products.data?.data ?? [];
  const total = products.data?.meta?.total ?? list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilter = search || categoryId;

  return (
    <div>
      <PageHeader title="Sản phẩm" subtitle={`${total} sản phẩm đang hoạt động`} />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) =>
              navigate({ search: (prev: ProductsSearch) => ({ ...prev, search: e.target.value, page: 1 }) })
            }
            placeholder="Tìm theo tên sản phẩm..."
            className="pl-9 h-11 rounded-lg bg-card"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) =>
            navigate({ search: (prev: ProductsSearch) => ({ ...prev, categoryId: e.target.value, page: 1 }) })
          }
          className="h-11 px-3 rounded-lg border border-input bg-card text-sm min-w-[180px]"
        >
          <option value="">Tất cả danh mục</option>
          {(categories.data?.data ?? []).map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {hasFilter && (
          <button
            onClick={() => navigate({ search: { search: "", categoryId: "", page: 1 } })}
            className="h-11 px-3 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted inline-flex items-center gap-1"
          >
            <X className="size-4" /> Xóa lọc
          </button>
        )}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {list.map((p: any) => (
              <div
                key={p.id}
                className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden flex flex-col"
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  {p.image || p.images?.[0] ? (
                    <img
                      src={p.image ?? p.images?.[0]}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground">
                      <Package className="size-8" />
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                    {p.name}
                  </p>
                  <div className="mt-auto pt-2 flex items-baseline justify-between gap-2">
                    <span className="text-primary font-bold text-base">
                      {formatVnd(p.price)}
                    </span>
                    {p.rank != null && (
                      <span className="text-xs text-muted-foreground">
                        #{p.rank}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const window = 2;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - window && i <= page + window)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6 flex-wrap">
      <Link
        from={Route.fullPath}
        search={(prev: ProductsSearch) => ({ ...prev, page: Math.max(1, page - 1) })}
        disabled={page === 1}
        className="h-9 px-3 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted aria-disabled:opacity-50 aria-disabled:pointer-events-none"
        aria-disabled={page === 1}
      >
        Trước
      </Link>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Link
            key={p}
            from={Route.fullPath}
            search={(prev: ProductsSearch) => ({ ...prev, page: p })}
            className={`h-9 min-w-9 px-3 rounded-lg text-sm font-medium grid place-items-center ${
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
        disabled={page >= totalPages}
        className="h-9 px-3 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted aria-disabled:opacity-50 aria-disabled:pointer-events-none"
        aria-disabled={page >= totalPages}
      >
        Sau
      </Link>
    </div>
  );
}