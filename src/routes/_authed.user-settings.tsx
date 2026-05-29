import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, DataState } from "@/components/page-header";

export const Route = createFileRoute("/_authed/user-settings")({
  head: () => ({ meta: [{ title: "Cấu hình hệ thống — HappyMall Admin" }] }),
  component: UserSettingsPage,
});

function UserSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Cấu hình hệ thống"
        subtitle="Thay đổi banner của hệ thống"
      />
      <DataState empty emptyText="Chưa có cấu hình banner" />
    </div>
  );
}
