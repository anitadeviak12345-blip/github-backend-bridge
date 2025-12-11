import { useState } from "react";
import { Brain, ChevronDown, Lock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { brainModules, getCategories, categoryNames, type BrainModule } from "@/config/brainModules";
import { useSubscription } from "@/hooks/useSubscription";

interface ModuleSelectorProps {
  selectedModule: BrainModule;
  onSelectModule: (module: BrainModule) => void;
}

const ModuleSelector = ({ selectedModule, onSelectModule }: ModuleSelectorProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { canAccessModule, currentPlan } = useSubscription();

  const categories = getCategories();
  
  const filteredModules = brainModules.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.nameHi?.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (module: BrainModule) => {
    if (canAccessModule(module.id)) {
      onSelectModule(module);
      setOpen(false);
      setSearch("");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 h-9">
          <Brain className="h-4 w-4 text-primary" />
          <span className="max-w-[120px] truncate text-sm">{selectedModule.name}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-72">
          {search ? (
            // Show filtered results
            filteredModules.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No modules found
              </div>
            ) : (
              filteredModules.map((module) => {
                const hasAccess = canAccessModule(module.id);
                return (
                  <DropdownMenuItem
                    key={module.id}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
                      !hasAccess ? 'opacity-50' : ''
                    }`}
                    onClick={() => handleSelect(module)}
                    disabled={!hasAccess}
                  >
                    <span>{module.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{module.name}</p>
                      {module.nameHi && (
                        <p className="text-xs text-muted-foreground truncate">
                          {module.nameHi}
                        </p>
                      )}
                    </div>
                    {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground" />}
                    {selectedModule.id === module.id && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })
            )
          ) : (
            // Show by category
            categories.map((category) => {
              const categoryModules = brainModules.filter((m) => m.category === category);
              if (categoryModules.length === 0) return null;
              
              return (
                <div key={category}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                    {categoryNames[category] || category} ({categoryModules.length})
                  </div>
                  {categoryModules.slice(0, 5).map((module) => {
                    const hasAccess = canAccessModule(module.id);
                    return (
                      <DropdownMenuItem
                        key={module.id}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
                          !hasAccess ? 'opacity-50' : ''
                        }`}
                        onClick={() => handleSelect(module)}
                        disabled={!hasAccess}
                      >
                        <span>{module.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{module.name}</p>
                        </div>
                        {!hasAccess && <Lock className="h-3 w-3" />}
                        {selectedModule.id === module.id && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  {categoryModules.length > 5 && (
                    <div className="px-3 py-1 text-xs text-muted-foreground">
                      +{categoryModules.length - 5} more...
                    </div>
                  )}
                </div>
              );
            })
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-muted-foreground text-center">
          {currentPlan?.name || 'Free'} Plan • {brainModules.length} modules
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModuleSelector;
