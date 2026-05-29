import { useEffect, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  Gift,
  Newspaper,
  LogOut,
  ShoppingBag,
  Users,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { setToken } from "@/lib/api";

const productItems = [
  { title: "Danh mục", url: "/categories" },
  { title: "Sản phẩm", url: "/products" },
  { title: "Đánh giá", url: "/reviews" },
  { title: "Tồn kho", url: "/inventory" },
  { title: "Xuất nhập kho", url: "/stock-movements" },
] as const;

const orderItems = [
  { title: "Đơn hàng", url: "/pos-orders" },
  { title: "Đơn hàng Online", url: "/orders" },
] as const;

const items = [
  { title: "Tổng quan", url: "/", icon: LayoutDashboard },
  { title: "Voucher", url: "/vouchers", icon: Ticket },
  { title: "Vòng quay", url: "/wheel", icon: Gift },
  { title: "Tin tức", url: "/news", icon: Newspaper },
  { title: "Người dùng", url: "/users", icon: Users },
] as const;

export function AppSidebar() {
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);
  const isProductSection = productItems.some((item) => isActive(item.url));
  const isOrderSection = orderItems.some((item) => isActive(item.url));
  const [productsOpen, setProductsOpen] = useState(isProductSection);
  const [ordersOpen, setOrdersOpen] = useState(isOrderSection);

  useEffect(() => {
    if (isProductSection) {
      setProductsOpen(true);
    }
  }, [isProductSection]);

  useEffect(() => {
    if (isOrderSection) {
      setOrdersOpen(true);
    }
  }, [isOrderSection]);

  function handleLogout() {
    setToken(null);
    navigate({ to: "/login" });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
            <ShoppingBag className="size-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="font-bold text-sm leading-tight">HappyMall</p>
            <p className="text-xs opacity-70">Admin</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isProductSection}
                      tooltip="Quản lý sản phẩm"
                      className="group"
                    >
                      <Package className="size-4" />
                      <span>Quản lý sản phẩm</span>
                      <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent asChild>
                    <SidebarMenuSub>
                      {productItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                            <Link to={item.url} className="flex items-center gap-2">
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Collapsible open={ordersOpen} onOpenChange={setOrdersOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isOrderSection}
                      tooltip="Quản lý đơn hàng"
                      className="group"
                    >
                      <ShoppingCart className="size-4" />
                      <span>Quản lý đơn hàng</span>
                      <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent asChild>
                    <SidebarMenuSub>
                      {orderItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
                            <Link to={item.url} className="flex items-center gap-2">
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Đăng xuất">
              <LogOut className="size-4" />
              <span>Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
