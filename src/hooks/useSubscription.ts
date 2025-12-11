import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Plan {
  id: string;
  name: string;
  name_hi: string | null;
  price: number;
  currency: string;
  period: string;
  description: string | null;
  features: string[];
  limits: {
    daily_messages: number;
    monthly_messages: number;
    image_uploads: number;
    modules: string[] | string;
    api_access?: boolean;
    webhooks?: boolean;
  };
  sort_order: number;
}

export interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
}

export interface UsageData {
  current: number;
  limit: number;
  remaining: number;
  allowed: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (!error && data) {
      setPlans(data.map(p => ({
        ...p,
        features: Array.isArray(p.features) ? (p.features as unknown as string[]) : [],
        limits: p.limits as unknown as Plan['limits']
      })));
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
    }

    if (data) {
      setSubscription(data);
      const plan = plans.find(p => p.id === data.plan_id);
      setCurrentPlan(plan || null);
    } else {
      // Create free subscription for user
      const { data: newSub } = await supabase
        .from('user_subscriptions')
        .insert({ user_id: user.id, plan_id: 'free', status: 'active' })
        .select()
        .single();
      
      if (newSub) {
        setSubscription(newSub);
        setCurrentPlan(plans.find(p => p.id === 'free') || null);
      }
    }
  }, [user, plans]);

  const checkUsage = useCallback(async (): Promise<UsageData> => {
    if (!user) return { current: 0, limit: 50, remaining: 50, allowed: true };

    const { data, error } = await supabase.rpc('check_usage_limit', { p_user_id: user.id });

    if (error) {
      console.error('Error checking usage:', error);
      return { current: 0, limit: 50, remaining: 50, allowed: true };
    }

    const usageData = data as unknown as UsageData;
    setUsage(usageData);
    return usageData;
  }, [user]);

  const incrementUsage = useCallback(async (moduleId?: string, hasImage?: boolean) => {
    if (!user) return null;

    const { data, error } = await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_module_id: moduleId || null,
      p_has_image: hasImage || false
    });

    if (error) {
      console.error('Error incrementing usage:', error);
      return null;
    }

    const usageData = data as unknown as UsageData;
    setUsage(usageData);
    return usageData;
  }, [user]);

  const canAccessModule = useCallback((moduleId: string): boolean => {
    if (!currentPlan) return true; // Allow if no plan loaded yet
    
    const modules = currentPlan.limits.modules;
    if (modules === 'all') return true;
    if (modules === 'all_basic') return true; // For plus plan
    if (Array.isArray(modules)) {
      return modules.includes(moduleId) || modules.includes('default');
    }
    return true;
  }, [currentPlan]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (plans.length > 0 && user) {
      fetchSubscription();
      checkUsage();
    }
    setIsLoading(false);
  }, [plans, user, fetchSubscription, checkUsage]);

  return {
    plans,
    subscription,
    currentPlan,
    usage,
    isLoading,
    checkUsage,
    incrementUsage,
    canAccessModule,
    refetch: fetchSubscription
  };
};
