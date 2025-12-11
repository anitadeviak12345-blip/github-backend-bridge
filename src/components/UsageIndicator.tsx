import { useSubscription } from "@/hooks/useSubscription";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const UsageIndicator = () => {
  const { usage, currentPlan } = useSubscription();

  if (!usage) return null;

  const isUnlimited = usage.limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, (usage.current / usage.limit) * 100);
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 cursor-pointer">
            <Zap className={`h-3.5 w-3.5 ${isCritical ? 'text-destructive' : isWarning ? 'text-yellow-500' : 'text-primary'}`} />
            {isUnlimited ? (
              <span className="text-xs font-medium text-muted-foreground">∞</span>
            ) : (
              <>
                <Progress
                  value={percentage}
                  className={`w-16 h-1.5 ${isCritical ? '[&>div]:bg-destructive' : isWarning ? '[&>div]:bg-yellow-500' : ''}`}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {usage.remaining}
                </span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs">
            <p className="font-medium">{currentPlan?.name || 'Free'} Plan</p>
            {isUnlimited ? (
              <p className="text-muted-foreground">Unlimited messages</p>
            ) : (
              <p className="text-muted-foreground">
                {usage.current}/{usage.limit} messages today
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UsageIndicator;
