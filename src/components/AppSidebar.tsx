import { Link, useLocation } from "react-router-dom";
import {
  MessageSquare,
  Settings,
  X,
  Menu,
  Key,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { title: "AI Chat", url: "/app/chat", icon: MessageSquare, primary: true },
  { title: "API Keys", url: "/app/api-keys", icon: Key },
];

const settingsItems = [
  { title: "Settings", url: "/app/settings", icon: Settings },
];

const AppSidebar = ({ isOpen, onToggle }: AppSidebarProps) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: typeof menuItems[0] }) => (
    <Link
      to={item.url}
      onClick={() => onToggle()}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
        isActive(item.url)
          ? "gradient-primary text-primary-foreground shadow-glow"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        item.primary && !isActive(item.url) && "bg-primary/10 text-foreground"
      )}
    >
      <item.icon className="h-5 w-5" />
      <span className="font-medium">{item.title}</span>
    </Link>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <div className="font-bold text-foreground">Luvio AI</div>
              <div className="text-xs text-muted-foreground">Powering Ideas with AI</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onToggle}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavItem key={item.url} item={item} />
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-1">
            {settingsItems.map((item) => (
              <NavItem key={item.url} item={item} />
            ))}
          </div>
        </nav>
      </aside>

      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-30 lg:hidden"
        onClick={onToggle}
      >
        <Menu className="h-6 w-6" />
      </Button>
    </>
  );
};

export default AppSidebar;
