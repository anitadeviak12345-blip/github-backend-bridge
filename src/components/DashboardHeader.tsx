import { Crown, Bell, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserDropdown from "@/components/UserDropdown";
import SubscriptionModal from "@/components/SubscriptionModal";

const DashboardHeader = () => {
  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <Brain className="h-6 w-6 text-primary" />
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <SubscriptionModal>
          <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
            <Crown className="h-5 w-5" />
          </Button>
        </SubscriptionModal>

        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        <UserDropdown />
      </div>
    </header>
  );
};

export default DashboardHeader;
