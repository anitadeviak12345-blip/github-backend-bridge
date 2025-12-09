import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, Globe, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [language, setLanguage] = useState("HI");

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    });
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-2xl font-semibold">
                {initial}
              </div>
              <div>
                <p className="font-medium text-foreground">{displayName}</p>
                <p className="text-sm text-muted-foreground">{user?.email || "No email"}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" defaultValue={displayName} placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user?.email || ""} disabled className="bg-muted" />
              </div>
            </div>

            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription
            </CardTitle>
            <CardDescription>Manage your subscription plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">Current Plan</p>
                  <Badge variant="secondary">Free</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Basic features with limited API calls
                </p>
              </div>
              <Button variant="outline">Upgrade Plan</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border border-border">
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">API Calls Today</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-2xl font-bold text-foreground">100</p>
                <p className="text-sm text-muted-foreground">Daily Limit</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <p className="text-2xl font-bold text-foreground">∞</p>
                <p className="text-sm text-muted-foreground">Chat Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Language
            </CardTitle>
            <CardDescription>Choose your preferred language</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={language === "EN" ? "default" : "outline"}
                onClick={() => setLanguage("EN")}
              >
                English
              </Button>
              <Button
                variant={language === "HI" ? "default" : "outline"}
                onClick={() => setLanguage("HI")}
              >
                हिंदी
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Notification settings coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
