import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command, CommandDialog, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useQuizzes } from "@/hooks/useQuizzes";
import { useConnections } from "@/hooks/useConnections";
import {
  LayoutDashboard, Link2, Sparkles, FileText, BarChart3,
  Settings, Search,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { label: "Connections", url: "/dashboard/connections", icon: Link2 },
  { label: "Generate Quiz", url: "/dashboard/generate", icon: Sparkles },
  { label: "Quizzes", url: "/dashboard/quizzes", icon: FileText },
  { label: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: quizzes } = useQuizzes();
  const { connections } = useConnections();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {navItems.map((item) => (
            <CommandItem
              key={item.url}
              onSelect={() => runCommand(() => navigate(item.url))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => navigate("/dashboard/generate"))}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate New Quiz
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/dashboard/connections"))}>
            <Link2 className="mr-2 h-4 w-4" />
            Add Connection
          </CommandItem>
        </CommandGroup>

        {quizzes && quizzes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quizzes">
              {quizzes.slice(0, 5).map((q) => (
                <CommandItem
                  key={q.id}
                  onSelect={() => runCommand(() => navigate(`/dashboard/quizzes/${q.id}`))}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {q.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {connections.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Connections">
              {connections.slice(0, 5).map((c) => (
                <CommandItem
                  key={c.id}
                  onSelect={() => runCommand(() => navigate("/dashboard/connections"))}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  {c.site_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
