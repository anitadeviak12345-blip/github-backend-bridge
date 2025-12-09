import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap } from "lucide-react";

interface SubscriptionModalProps {
  children: React.ReactNode;
}

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    description: "Basic features for getting started",
    features: [
      "100 API calls/day",
      "Basic AI models",
      "Email support",
      "Community access",
    ],
    current: true,
    icon: Zap,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "Advanced features for power users",
    features: [
      "Unlimited API calls",
      "Premium AI models",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
    ],
    popular: true,
    icon: Sparkles,
  },
  {
    name: "Enterprise",
    price: "₹1999",
    period: "/month",
    description: "Full suite for teams and businesses",
    features: [
      "Everything in Pro",
      "Dedicated support",
      "Custom AI training",
      "SLA guarantee",
      "Team management",
      "API priority access",
    ],
    icon: Crown,
  },
];

const SubscriptionModal = ({ children }: SubscriptionModalProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-card border-border overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Plan
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Upgrade to unlock more features and capabilities
          </p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2">
          <div className="grid gap-4 md:grid-cols-3 mt-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-6 transition-all hover:shadow-lg ${
                plan.popular
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-background"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              {plan.current && (
                <Badge
                  variant="secondary"
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  Current Plan
                </Badge>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    plan.popular ? "bg-primary/20" : "bg-secondary"
                  }`}
                >
                  <plan.icon
                    className={`w-5 h-5 ${
                      plan.popular ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-lg text-foreground">
                  {plan.name}
                </h3>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                {plan.description}
              </p>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.current ? "outline" : plan.popular ? "default" : "secondary"}
                disabled={plan.current}
              >
                {plan.current ? "Current Plan" : "Upgrade"}
              </Button>
            </div>
          ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
