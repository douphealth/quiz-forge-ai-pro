import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { TopBar } from "./TopBar";
import { AuthGuard } from "@/components/auth/AuthGuard";

export function DashboardLayout() {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
