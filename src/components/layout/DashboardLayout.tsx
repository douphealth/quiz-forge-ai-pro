import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { TopBar } from "./TopBar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { CommandPalette } from "./CommandPalette";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export function DashboardLayout() {
  const location = useLocation();

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
        <CommandPalette />
      </SidebarProvider>
    </AuthGuard>
  );
}
