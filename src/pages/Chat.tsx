import { useRef, useEffect, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useConversations } from "@/hooks/useConversations";
import { useSubscription } from "@/hooks/useSubscription";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ChatSidebar from "@/components/ChatSidebar";
import ModuleSelector from "@/components/ModuleSelector";
import UsageIndicator from "@/components/UsageIndicator";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import { defaultModule, type BrainModule } from "@/config/brainModules";
import { Trash2, Menu, Brain, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Chat = () => {
  const { messages, isLoading, sendMessage, clearMessages, conversationId, loadConversation, setConversationId, stopGeneration } = useChat();
  const { conversations, fetchConversations, deleteConversation } = useConversations();
  const { checkUsage, incrementUsage, canAccessModule } = useSubscription();
  const [selectedModule, setSelectedModule] = useState<BrainModule>(defaultModule);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      fetchConversations();
    }
  }, [conversationId, fetchConversations]);

  const handleSendMessage = async (input: string, attachments?: { url: string; type: string; name: string }[]) => {
    // Check usage limits before sending
    const usage = await checkUsage();
    if (!usage.allowed) {
      toast({
        title: "Daily limit reached",
        description: "आपकी daily limit खत्म हो गई। Please upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    // Check module access
    if (!canAccessModule(selectedModule.id)) {
      toast({
        title: "Module locked",
        description: "This module is not available in your plan. Please upgrade.",
        variant: "destructive",
      });
      return;
    }

    const hasImage = attachments?.some(a => a.type.startsWith('image/') || a.type === 'image');
    
    // Increment usage
    await incrementUsage(selectedModule.id, hasImage);
    
    sendMessage(input, selectedModule.systemPrompt, selectedModule.id, attachments);
  };

  const handleSelectModule = (module: BrainModule) => {
    if (canAccessModule(module.id)) {
      setSelectedModule(module);
      toast({
        title: `${module.name} activated`,
        description: module.nameHi || module.description,
      });
    }
  };

  const handleSelectConversation = (id: string) => {
    loadConversation(id);
    setShowMobileSidebar(false);
  };

  const handleNewChat = () => {
    clearMessages();
    setShowMobileSidebar(false);
  };

  const handleDeleteConversation = async (id: string) => {
    const success = await deleteConversation(id);
    if (success) {
      if (conversationId === id) {
        clearMessages();
      }
      toast({
        title: "Deleted",
        description: "Conversation deleted successfully",
      });
    }
  };

  return (
    <div className="flex h-full">
      <div className="hidden md:block">
        <ChatSidebar
          conversations={conversations}
          activeConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-background shadow-lg">
            <ChatSidebar
              conversations={conversations}
              activeConversationId={conversationId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              onDeleteConversation={handleDeleteConversation}
              isCollapsed={false}
              onToggleCollapse={() => setShowMobileSidebar(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="px-4 lg:px-8 py-3 border-b border-border bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={() => setShowMobileSidebar(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-semibold text-foreground">Luvio AI</h1>
                <p className="text-xs text-muted-foreground">GPT-5 Powered • 112 Modules</p>
              </div>
              <ModuleSelector 
                selectedModule={selectedModule} 
                onSelectModule={handleSelectModule} 
              />
            </div>
            <div className="flex items-center gap-2">
              <UsageIndicator />
              <NotificationsDropdown />
              {isLoading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopGeneration}
                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                >
                  <Square className="w-3 h-3 mr-1 fill-current" />
                  Stop
                </Button>
              )}
              {messages.length > 0 && !isLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 lg:px-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-24 h-24 rounded-full gradient-primary mb-4 ring-4 ring-primary/20 flex items-center justify-center">
                <Brain className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Luvio AI
              </h2>
              <p className="text-sm text-primary mb-1">लुवियो AI में आपका स्वागत है</p>
              <p className="text-muted-foreground max-w-md mt-2">
                आपका personal AI assistant - GPT-5 powered with 112+ specialized modules for every need.
              </p>
              <div className="mt-4 text-xs text-muted-foreground">
                Current Module: <span className="text-primary font-medium">{selectedModule.name}</span>
              </div>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span className="bg-primary/10 px-3 py-1.5 rounded-full">🏏 Dream11 Teams</span>
                <span className="bg-primary/10 px-3 py-1.5 rounded-full">🌾 Agriculture</span>
                <span className="bg-primary/10 px-3 py-1.5 rounded-full">💻 Coding Help</span>
                <span className="bg-primary/10 px-3 py-1.5 rounded-full">📚 Education</span>
                <span className="bg-primary/10 px-3 py-1.5 rounded-full">💰 Finance</span>
                <span className="bg-primary/10 px-3 py-1.5 rounded-full">✍️ Content</span>
              </div>
            </div>
          ) : (
            <div className="w-full py-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  attachments={message.attachments}
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 py-4">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                    <Brain className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-primary ml-1">Luvio AI</span>
                    <div className="bg-card border border-border rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 lg:px-8 border-t border-border bg-background/50 backdrop-blur-sm">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
