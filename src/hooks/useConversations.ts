import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  module_id: string | null;
};

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }

      setConversations(data || []);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const deleteConversation = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }

    setConversations(prev => prev.filter(c => c.id !== id));
    return true;
  }, []);

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id);

    if (error) {
      console.error('Error updating conversation:', error);
      return false;
    }

    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    return true;
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    fetchConversations,
    deleteConversation,
    updateConversationTitle,
  };
};
