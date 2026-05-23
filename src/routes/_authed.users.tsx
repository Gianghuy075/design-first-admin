import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PageHeader, DataState } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type UsersSearch = {
  q: string;
  page: number;
};

type UserItem = {
  id: string;
  name?: string | null;
  username?: string | null;
  zaloId?: string | null;
  isAdmin?: boolean;
  isActive?: boolean;
  createdAt?: string | null;
};

const usersSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1), 1).default(1),
});

const LIMIT = 20;

export const Route = createFileRoute("/_authed/users")({
  head: () => ({ meta: [{ title: "Người dùng — HappyMall Admin" }] }),
  validateSearch: zodValidator(usersSearchSchema),
  component: UsersPage,
});

function UsersPage() {
  const { q, page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["users-admin", { q, page }],
    queryFn: () =>
      apiFetch<UserItem[]>("/users/admin", {
        query: {
          search: q || undefined,
          page,
          limit: LIMIT,
        },
      }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { isActive?: boolean; isAdmin?: boolean };
    }) =>
      apiFetch(`/users/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onMutate: ({ id }) => {
      setPendingUserId(id);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["users-admin"] });
      if (typeof variables.payload.isActive === "boolean") {
        toast.success(
          variables.payload.isActive ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hóa tài khoản",
        );
        return;
      }
      toast.success(variables.payload.isAdmin ? "Đã cấp quyền admin" : "Đã gỡ quyền admin");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Cập nhật người dùng thất bại";
      toast.error(message);
    },
    onSettled: () => {
      setPendingUserId(null);
    },
  });

  const list = query.data?.data ?? [];
  const total = Number(query.data?.meta?.total ?? list.length);
  const responseLimit = Number(query.data?.meta?.limit ?? LIMIT);
  const totalPages = Math.max(1, Math.ceil(total / responseLimit));
  const hasFilter = Boolean(q);

  return (
    <div>
      <PageHeader title="Người dùng" subtitle={`Tổng ${total} người dùng`} />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) =>
              navigate({
                search: (prev: UsersSearch) => ({ ...prev, q: event.target.value, page: 1 }),
              })
            }
            placeholder="Tìm theo tên, username hoặc số điện thoại..."
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        {hasFilter ? (
          <button
            onClick={() => navigate({ search: { q: "", page: 1 } })}
            className="inline-flex h-11 items-center gap-1 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            <X className="size-4" />
            Xóa lọc
          </button>
        ) : null}
      </div>

      {query.isLoading || query.isError || list.length === 0 ? (
        <DataState
          loading={query.isLoading}
          error={query.error}
          empty={list.length === 0}
          emptyText="Không có người dùng"
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left">Tên</th>
                    <th className="px-6 py-3 text-left">Username</th>
                    <th className="px-6 py-3 text-left">Zalo ID</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">Hoạt động</th>
                    <th className="px-6 py-3 text-left">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((user) => (
                    <tr key={user.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-6 py-3 font-medium">{user.name ?? "—"}</td>
                      <td className="px-6 py-3">{user.username ?? "—"}</td>
                      <td className="px-6 py-3 font-mono text-xs">{user.zaloId ?? "—"}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(user.isAdmin)}
                            disabled={updateUserMutation.isPending && pendingUserId === user.id}
                            onCheckedChange={(checked) =>
                              updateUserMutation.mutate({
                                id: user.id,
                                payload: { isAdmin: checked },
                              })
                            }
                          />
                          <span
                            className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                              user.isAdmin
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {user.isAdmin ? "Admin" : "User"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(user.isActive)}
                            disabled={updateUserMutation.isPending && pendingUserId === user.id}
                            onCheckedChange={(checked) =>
                              updateUserMutation.mutate({
                                id: user.id,
                                payload: { isActive: checked },
                              })
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            {user.isActive ? "Đang hoạt động" : "Đã khóa"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <UsersPagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}

function UsersPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  const window = 2;
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
        search={(prev: UsersSearch) => ({ ...prev, page: Math.max(1, page - 1) })}
        className="h-9 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50"
        aria-disabled={page === 1}
      >
        Trước
      </Link>
      {pages.map((p, index) =>
        p === "…" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            from={Route.fullPath}
            search={(prev: UsersSearch) => ({ ...prev, page: p })}
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
        search={(prev: UsersSearch) => ({ ...prev, page: Math.min(totalPages, page + 1) })}
        className="h-9 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50"
        aria-disabled={page >= totalPages}
      >
        Sau
      </Link>
    </div>
  );
}
