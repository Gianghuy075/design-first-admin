import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatVnd, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

const STATUS_VALUES = [
  "",
  "placed",
  "paid",
  "shipping",
  "delivered",
  "unreviewed",
  "cancelled",
  "returned",
] as const;

const ordersSearchSchema = z.object({
  status: fallback(z.enum(STATUS_VALUES), "").default(""),
  q: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
});

type OrdersSearch = {
  status: (typeof STATUS_VALUES)[number];
  q: string;
  page: number;
};

export const Route = createFileRoute("/_authed/orders")({
  head: () => ({ meta: [{ title: "Đơn hàng — HappyMall Admin" }] }),
  validateSearch: zodValidator(ordersSearchSchema),
  component: OrdersPage,
});

const STATUSES = [
  { value: "", label: "Tất cả" },
  { value: "placed", label: "Đã đặt" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "shipping", label: "Đang giao" },
  { value: "delivered", label: "Đã giao" },
  { value: "unreviewed", label: "Chờ đánh giá" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "returned", label: "Đã trả" },
] as const;

const STATUS_TONE: Record<string, string> = {
  placed: "bg-blue-100 text-blue-700",
  paid: "bg-indigo-100 text-indigo-700",
  shipping: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  unreviewed: "bg-purple-100 text-purple-700",
  cancelled: "bg-rose-100 text-rose-700",
  returned: "bg-gray-200 text-gray-700",
};

const LIMIT = 15;

function OrdersPage() {
  const { status, q, page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const query = useQuery({
    queryKey: ["orders", status],
    queryFn: () =>
      apiFetch<any[]>("/orders", { query: { status: status || undefined } }),
  });
  const all = query.data?.data ?? [];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter((o: any) =>
      [(o.code ?? o.id), o.payMethod, o.note]
        .map((v) => (v ?? "").toString().toLowerCase())
        .some((s) => s.includes(term)),
    );
  }, [all, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const safePage = Math.min(page, totalPages);
  const list = filtered.slice((safePage - 1) * LIMIT, safePage * LIMIT);
  const hasFilter = status || q;

  return (
    <div>
      <PageHeader
        title="Đơn hàng"
        subtitle={`Hiển thị ${list.length} / ${filtered.length} đơn`}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            from={Route.fullPath}
            search={(prev: OrdersSearch) => ({ ...prev, status: s.value, page: 1 })}
            className={`h-9 px-4 rounded-full text-sm font-medium transition inline-flex items-center ${
              status === s.value
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-button)]"
                : "bg-card text-foreground border border-border hover:bg-muted"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) =>
              navigate({
                search: (prev: OrdersSearch) => ({
                  ...prev,
                  q: e.target.value,
                  page: 1,
                }),
              })
            }
            placeholder="Tìm theo mã đơn, phương thức, ghi chú..."
            className="pl-9 h-11 rounded-lg bg-card"
          />
        </div>
        {hasFilter && (
          <button
            onClick={() =>
              navigate({ search: { status: "", q: "", page: 1 } })
            }
            className="h-11 px-3 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted inline-flex items-center gap-1"
          >
            <X className="size-4" /> Xóa lọc
          </button>
        )}
      </div>

      {query.isLoading || query.isError || list.length === 0 ? (
        <DataState
          loading={query.isLoading}
          error={query.error}
          empty={list.length === 0}
          emptyText="Không có đơn hàng"
        />
      ) : (
        <>
          <div className="rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-6 py-3">Mã đơn</th>
                    <th className="text-left px-6 py-3">Trạng thái</th>
                    <th className="text-left px-6 py-3">Sản phẩm</th>
                    <th className="text-right px-6 py-3">Tổng</th>
                    <th className="text-left px-6 py-3">Thanh toán</th>
                    <th className="text-left px-6 py-3">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((o: any) => (
                    <tr
                      key={o.id}
                      className="border-t border-border hover:bg-muted/30"
                    >
                      <td className="px-6 py-3 font-mono font-semibold">
                        {o.code ?? o.id}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                            STATUS_TONE[o.status] ?? "bg-muted"
                          }`}
                        >
                          {STATUSES.find((s) => s.value === o.status)?.label ??
                            o.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {(o.items?.length ?? 0)} món
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-primary">
                        {formatVnd(o.total)}
                      </td>
                      <td className="px-6 py-3">{o.payMethod ?? "—"}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {formatDate(o.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <OrdersPagination page={safePage} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}

function OrdersPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
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
        search={(prev: OrdersSearch) => ({ ...prev, page: Math.max(1, page - 1) })}
        className="h-9 px-3 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted aria-disabled:opacity-50 aria-disabled:pointer-events-none"
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
            search={(prev: OrdersSearch) => ({ ...prev, page: p })}
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
        search={(prev: OrdersSearch) => ({
          ...prev,
          page: Math.min(totalPages, page + 1),
        })}
        className="h-9 px-3 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted aria-disabled:opacity-50 aria-disabled:pointer-events-none"
        aria-disabled={page >= totalPages}
      >
        Sau
      </Link>
    </div>
  );
}