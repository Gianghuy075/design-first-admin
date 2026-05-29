import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, DataState } from "@/components/page-header";

export const Route = createFileRoute("/_authed/inventory")({
  head: () => ({ meta: [{ title: "Tồn kho — HappyMall Admin" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  return (
    <div>
      <PageHeader
        title="Tồn kho"
        subtitle="Theo dõi số lượng tồn kho hiện tại"
      />
      <DataState empty emptyText="Chưa có dữ liệu tồn kho" />
    </div>
  );
}
