import { useNavigate } from "react-router-dom";
import {
  User,
  CreditCard,
  HelpCircle,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import SubscriptionModal from "@/components/SubscriptionModal";

const UserDropdown = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold">
            {initial}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-card border-border">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xl font-semibold">
              {initial}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{displayName}</div>
              <div className="text-sm text-muted-foreground truncate">
                {user?.email || "No email"}
              </div>
              <Badge variant="secondary" className="mt-1 text-xs">
                <User className="w-3 h-3 mr-1" />
                Free Plan
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          className="flex items-center gap-3 py-3 cursor-pointer"
          onClick={() => navigate("/app/settings")}
        >
          <User className="w-5 h-5 text-muted-foreground" />
          <span>Profile & Settings</span>
        </DropdownMenuItem>

        <SubscriptionModal>
          <DropdownMenuItem
            className="flex items-center gap-3 py-3 cursor-pointer"
            onSelect={(e) => e.preventDefault()}
          >
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <span>Manage Subscription</span>
          </DropdownMenuItem>
        </SubscriptionModal>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem className="flex items-center gap-3 py-3 cursor-pointer">
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex items-center gap-3 py-3 cursor-pointer text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
