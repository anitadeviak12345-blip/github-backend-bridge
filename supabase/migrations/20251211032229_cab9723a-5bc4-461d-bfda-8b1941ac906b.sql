-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_hi TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  period TEXT NOT NULL DEFAULT 'month',
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default plans
INSERT INTO public.subscription_plans (id, name, name_hi, price, description, features, limits, sort_order) VALUES
('free', 'Free', 'फ्री', 0, 'Basic features for getting started', 
  '["50 messages/day", "Basic AI modules", "Email support", "Community access"]'::jsonb,
  '{"daily_messages": 50, "monthly_messages": 500, "image_uploads": 10, "modules": ["default", "general-chat", "learning-tutor", "code-writing", "summarization"]}'::jsonb, 1),
('plus', 'Plus', 'प्लस', 299, 'More features for regular users',
  '["200 messages/day", "50+ AI modules", "Priority support", "Voice input", "Image analysis"]'::jsonb,
  '{"daily_messages": 200, "monthly_messages": 3000, "image_uploads": 50, "modules": "all_basic"}'::jsonb, 2),
('premium', 'Premium', 'प्रीमियम', 599, 'Advanced features for power users',
  '["Unlimited messages", "All 112 AI modules", "24/7 support", "Advanced analytics", "API access"]'::jsonb,
  '{"daily_messages": -1, "monthly_messages": -1, "image_uploads": -1, "modules": "all"}'::jsonb, 3),
('developer', 'Developer', 'डेवलपर', 1499, 'Full API access for developers',
  '["Everything in Premium", "API key management", "Webhook support", "Custom integrations", "White-label options"]'::jsonb,
  '{"daily_messages": -1, "monthly_messages": -1, "image_uploads": -1, "modules": "all", "api_access": true, "webhooks": true}'::jsonb, 4);

-- Enable RLS on plans (public read)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are viewable by everyone" ON public.subscription_plans FOR SELECT USING (true);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id) DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Create usage tracking table
CREATE TABLE public.usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER NOT NULL DEFAULT 0,
  image_count INTEGER NOT NULL DEFAULT 0,
  module_usage JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own usage" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usage" ON public.usage_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own usage" ON public.usage_tracking FOR UPDATE USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Create message logs table
CREATE TABLE public.message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  module_id TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  response_time_ms INTEGER,
  has_image BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own logs" ON public.message_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logs" ON public.message_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to auto-create subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_id, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID, p_module_id TEXT DEFAULT NULL, p_has_image BOOLEAN DEFAULT false)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_current_usage RECORD;
  v_plan_limits JSONB;
  v_daily_limit INTEGER;
BEGIN
  -- Get user's plan limits
  SELECT sp.limits INTO v_plan_limits
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id AND us.status = 'active';
  
  IF v_plan_limits IS NULL THEN
    v_plan_limits := '{"daily_messages": 50}'::jsonb;
  END IF;
  
  v_daily_limit := COALESCE((v_plan_limits->>'daily_messages')::INTEGER, 50);
  
  -- Upsert usage record
  INSERT INTO public.usage_tracking (user_id, date, message_count, image_count, module_usage)
  VALUES (
    p_user_id, 
    CURRENT_DATE, 
    1, 
    CASE WHEN p_has_image THEN 1 ELSE 0 END,
    CASE WHEN p_module_id IS NOT NULL THEN jsonb_build_object(p_module_id, 1) ELSE '{}'::jsonb END
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    message_count = usage_tracking.message_count + 1,
    image_count = usage_tracking.image_count + CASE WHEN p_has_image THEN 1 ELSE 0 END,
    module_usage = CASE 
      WHEN p_module_id IS NOT NULL THEN 
        usage_tracking.module_usage || jsonb_build_object(
          p_module_id, 
          COALESCE((usage_tracking.module_usage->>p_module_id)::INTEGER, 0) + 1
        )
      ELSE usage_tracking.module_usage
    END,
    updated_at = now()
  RETURNING message_count, image_count INTO v_current_usage;
  
  -- Check limits (-1 means unlimited)
  IF v_daily_limit != -1 AND v_current_usage.message_count > v_daily_limit THEN
    v_result := jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit_exceeded',
      'current', v_current_usage.message_count,
      'limit', v_daily_limit
    );
  ELSE
    v_result := jsonb_build_object(
      'allowed', true,
      'current', v_current_usage.message_count,
      'limit', v_daily_limit,
      'remaining', CASE WHEN v_daily_limit = -1 THEN -1 ELSE v_daily_limit - v_current_usage.message_count END
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to check usage before sending
CREATE OR REPLACE FUNCTION public.check_usage_limit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_current_usage INTEGER;
  v_plan_limits JSONB;
  v_daily_limit INTEGER;
BEGIN
  -- Get user's plan limits
  SELECT sp.limits INTO v_plan_limits
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id AND us.status = 'active';
  
  IF v_plan_limits IS NULL THEN
    v_plan_limits := '{"daily_messages": 50}'::jsonb;
  END IF;
  
  v_daily_limit := COALESCE((v_plan_limits->>'daily_messages')::INTEGER, 50);
  
  -- Get current usage
  SELECT COALESCE(message_count, 0) INTO v_current_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  IF v_current_usage IS NULL THEN
    v_current_usage := 0;
  END IF;
  
  IF v_daily_limit != -1 AND v_current_usage >= v_daily_limit THEN
    v_result := jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit_exceeded',
      'current', v_current_usage,
      'limit', v_daily_limit
    );
  ELSE
    v_result := jsonb_build_object(
      'allowed', true,
      'current', v_current_usage,
      'limit', v_daily_limit,
      'remaining', CASE WHEN v_daily_limit = -1 THEN -1 ELSE v_daily_limit - v_current_usage END
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();