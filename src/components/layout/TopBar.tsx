import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header className="h-14 border-b border-border flex items-center gap-3 px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      <SidebarTrigger />
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full ring-2 ring-border hover:ring-primary transition-all">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
              <Settings className="h-4 w-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
