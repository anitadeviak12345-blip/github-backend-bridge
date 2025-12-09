import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain } from "lucide-react";

const Index = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen">
      <div className="container max-w-6xl mx-auto px-6 py-7">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <div className="font-bold text-xl text-foreground">Luvio AI</div>
              <div className="text-xs text-muted-foreground">AI for Everyone</div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-border/50 text-muted-foreground hover:bg-muted">
              Docs
            </Button>
            <Link to="/auth">
              <Button className="gradient-primary shadow-glow">Start Free</Button>
            </Link>
          </div>
        </header>

        <main className="grid lg:grid-cols-[1fr_420px] gap-7 items-center py-12">
          <div className="animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-foreground">
              Meet Luvio — Your Personal AI Universe
            </h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Chat, build, and automate with 75+ modular AI tools. Multi-brain architecture: GPT-5 powered for maximum intelligence.
            </p>
            <div className="mt-5 flex gap-3">
              <Link to="/auth">
                <Button className="gradient-primary shadow-glow">Try Chat</Button>
              </Link>
              <Button variant="outline" className="border-border/50 text-muted-foreground hover:bg-muted">
                API Docs
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <FeatureCard title="Chat & Conversation" desc="Multi-lingual, long-context support" />
              <FeatureCard title="75+ Modules" desc="Finance, Study, Dream11, Marketing, Voice & more" />
              <FeatureCard title="GPT-5 Powered" desc="Latest AI technology for best results" />
            </div>

            <Card className="mt-5 p-4 bg-card border-border/30">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="font-bold text-foreground">Developers</div>
                  <div className="text-sm text-muted-foreground">Simple REST API & SDKs (coming soon)</div>
                </div>
                <code className="bg-background/80 px-3 py-2 rounded-lg text-sm text-primary font-mono">
                  curl -X POST /chat -H "x-api-key: YOUR_KEY"
                </code>
              </div>
            </Card>
          </div>

          <aside className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Card className="p-5 bg-card border-border/30">
              <div className="font-bold text-foreground">Primary Features</div>
              <div className="flex flex-wrap gap-3 mt-4">
                <BrainBadge>GPT-5</BrainBadge>
                <BrainBadge>Voice Input</BrainBadge>
                <BrainBadge>File Upload</BrainBadge>
              </div>

              <div className="mt-5">
                <div className="text-sm text-muted-foreground">Usecases</div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <UsecaseTag>Healthcare</UsecaseTag>
                  <UsecaseTag>Finance</UsecaseTag>
                  <UsecaseTag>Education</UsecaseTag>
                  <UsecaseTag>Smart Cities</UsecaseTag>
                </div>
              </div>

              <div className="mt-5">
                <div className="font-bold text-foreground">API Preview</div>
                <code className="block mt-2 bg-background/80 p-3 rounded-lg text-sm text-primary/80 font-mono">
                  POST /chat<br />
                  {"{ message }"}
                </code>
              </div>
            </Card>
          </aside>
        </main>

        <section className="mt-5">
          <h3 className="text-2xl font-bold text-foreground">Why Luvio AI?</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Single platform for users and developers — Chat UI for quick tasks, API for automation and integration. Modular, secure and multilingual.
          </p>

          <div className="flex flex-col md:flex-row gap-4 mt-5">
            <PricingCard
              title="Free"
              desc="1000 calls / month • Basic models"
              cta="Get Free Key"
            />
            <PricingCard
              title="Developer"
              desc="100k calls / month • Priority support"
              cta="Get API"
            />
            <PricingCard
              title="Enterprise"
              desc="Custom • SLA • On-prem options"
              cta="Contact Sales"
            />
          </div>
        </section>

        <footer className="py-7 mt-7 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-bold text-foreground">Luvio AI</span>
            <span className="text-sm text-muted-foreground ml-2">• AI for Everyone</span>
          </div>
          <div className="text-sm text-muted-foreground">© {currentYear} Luvio AI</div>
        </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, desc }: { title: string; desc: string }) => (
  <Card className="p-4 bg-card/50 border-border/20 hover:border-primary/30 transition-colors">
    <div className="font-semibold text-foreground">{title}</div>
    <div className="text-sm text-muted-foreground mt-1">{desc}</div>
  </Card>
);

const BrainBadge = ({ children }: { children: React.ReactNode }) => (
  <div className="px-3 py-2 rounded-lg bg-muted border border-border/30 font-semibold text-sm text-foreground">
    {children}
  </div>
);

const UsecaseTag = ({ children }: { children: React.ReactNode }) => (
  <div className="glass px-3 py-3 rounded-lg text-center text-sm text-muted-foreground border border-border/20">
    {children}
  </div>
);

const PricingCard = ({ title, desc, cta }: { title: string; desc: string; cta: string }) => (
  <Card className="p-5 bg-card/80 border-border/30 flex-1 min-w-[240px]">
    <h4 className="text-lg font-bold text-foreground">{title}</h4>
    <div className="text-sm text-muted-foreground mt-1">{desc}</div>
    <Button className="mt-4 w-full gradient-primary shadow-glow">{cta}</Button>
  </Card>
);

export default Index;
