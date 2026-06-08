import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ShoppingCart, ClipboardList, ChefHat, Utensils,
  Grid3x3, Tags, Package, Receipt, CreditCard, BarChart3,
  Database, Settings, Key, LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "POS Billing", url: "/pos", icon: ShoppingCart },
  { title: "Orders", url: "/orders", icon: ClipboardList },
  { title: "KOT", url: "/kot", icon: ChefHat },
  { title: "Kitchen Screen", url: "/kitchen", icon: Utensils },
];
const manageItems = [
  { title: "Dining Tables", url: "/tables", icon: Grid3x3 },
  { title: "Categories", url: "/categories", icon: Tags },
  { title: "Items", url: "/items", icon: Package },
  { title: "Bills", url: "/bills", icon: Receipt },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];
const systemItems = [
  { title: "Backups", url: "/backups", icon: Database },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "License", url: "/license", icon: Key },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const router = useRouter();
  const isActive = (url: string) => path === url;

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Adapt POS</span>
            <span className="text-xs text-sidebar-foreground/60">Restaurant Billing</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Main", mainItems)}
        {renderGroup("Manage", manageItems)}
        {renderGroup("System", systemItems)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                await supabase.auth.signOut();
                router.navigate({ to: "/login" });
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}