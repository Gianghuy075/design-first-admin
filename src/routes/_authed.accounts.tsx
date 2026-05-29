import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, DataState } from "@/components/page-header";

export const Route = createFileRoute("/_authed/accounts")({
  head: () => ({ meta: [{ title: "Tài khoản nhân viên — HappyMall Admin" }] }),
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <div>
      <PageHeader
        title="Tài khoản"
        subtitle="Quản lý tài khoản nhân viên"
      />
      <DataState empty emptyText="Chưa có tài khoản" />
    </div>
  );
}
