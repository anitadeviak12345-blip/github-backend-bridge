import { useState, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Attachment = {
  url: string;
  type: string;
  name: string;
  base64?: string; // For sending to AI
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Convert image URL to base64 for vision models
const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return url; // Fallback to URL
  }
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadConversation = useCallback(async (convId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setConversationId(convId);
    setMessages(
      (data || []).map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
    );
  }, [user]);

  const ensureConversation = useCallback(async (moduleId?: string, firstMessage?: string) => {
    if (!user) return null;
    if (conversationId) return conversationId;

    const title = firstMessage
      ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
      : 'New Chat';

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        module_id: moduleId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    setConversationId(data.id);
    return data.id;
  }, [user, conversationId]);

  const saveMessage = useCallback(async (convId: string, role: string, content: string) => {
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: convId,
        role,
        content,
      });

    if (error) {
      console.error('Error saving message:', error);
    }
  }, []);

  const sendMessage = useCallback(async (
    input: string, 
    systemPrompt?: string, 
    moduleId?: string, 
    attachments?: Attachment[]
  ) => {
    if ((!input.trim() && (!attachments || attachments.length === 0)) || isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const hasImages = attachments?.some(a => a.type.startsWith('image/') || a.type === 'image');
    
    const messageContent = attachments && attachments.length > 0
      ? `${input.trim()}\n\n[Attachments: ${attachments.map(a => a.name).join(', ')}]`
      : input.trim();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageContent,
      attachments,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = "";

    try {
      const convId = await ensureConversation(moduleId, input.trim());
      
      // Save user message immediately (don't wait)
      if (convId) {
        saveMessage(convId, 'user', userMessage.content);
      }

      // Format messages with image support for vision models
      const formattedMessages = await Promise.all([...messages, userMessage].map(async (m) => {
        // If message has image attachments, format for vision with base64
        if (m.attachments && m.attachments.some(a => a.type.startsWith('image/') || a.type === 'image')) {
          const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
          
          // Clean content text
          const cleanContent = m.content.replace(/\n\n\[Attachments:.*\]$/, '').trim();
          if (cleanContent) {
            content.push({ type: 'text', text: cleanContent });
          }
          
          // Convert images to base64 for better AI processing
          for (const att of m.attachments) {
            if (att.type.startsWith('image/') || att.type === 'image') {
              const base64 = att.base64 || await imageUrlToBase64(att.url);
              content.push({
                type: 'image_url',
                image_url: { url: base64 }
              });
            }
          }
          
          return { role: m.role, content };
        }
        
        return { role: m.role, content: m.content };
      }));

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: formattedMessages,
          systemPrompt,
          moduleId,
          userId: user?.id,
          conversationId: convId,
          hasImage: hasImages,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          throw new Error("Rate limit exceeded. कृपया कुछ देर बाद try करें।");
        }
        if (response.status === 402) {
          throw new Error("Credits खत्म हो गए। Please add credits to continue.");
        }

        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const assistantId = crypto.randomUUID();

      // Optimized streaming with batched updates
      let lastUpdateTime = 0;
      const UPDATE_INTERVAL = 16; // ~60fps

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              
              // Throttle UI updates for performance
              const now = Date.now();
              if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                lastUpdateTime = now;
                const currentContent = assistantContent;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant" && last.id === assistantId) {
                    return prev.map((m) =>
                      m.id === assistantId ? { ...m, content: currentContent } : m
                    );
                  }
                  return [...prev, { id: assistantId, role: "assistant", content: currentContent }];
                });
              }
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Final update with complete content
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === assistantId) {
          return prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { id: assistantId, role: "assistant", content: assistantContent }];
      });

      // Save assistant message
      if (convId && assistantContent) {
        saveMessage(convId, 'assistant', assistantContent);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, user, ensureConversation, saveMessage]);

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setConversationId(null);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return { 
    messages, 
    isLoading, 
    sendMessage, 
    clearMessages, 
    conversationId, 
    loadConversation, 
    setConversationId,
    stopGeneration 
  };
};
