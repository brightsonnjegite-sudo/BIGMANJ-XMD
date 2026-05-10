-- Create trial status enum
CREATE TYPE public.trial_status AS ENUM ('active', 'expired');

-- Create user_trials table
CREATE TABLE public.user_trials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status trial_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

-- Users can view their own trial
CREATE POLICY "Users can view own trial"
ON public.user_trials
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own trial (first time only, enforced by unique constraint)
CREATE POLICY "Users can insert own trial"
ON public.user_trials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own trial (to mark expired)
CREATE POLICY "Users can update own trial"
ON public.user_trials
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all trials
CREATE POLICY "Admins can manage trials"
ON public.user_trials
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_user_trials_updated_at
BEFORE UPDATE ON public.user_trials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function to check trial status without RLS recursion
CREATE OR REPLACE FUNCTION public.check_trial_status(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trial_record RECORD;
  result JSON;
BEGIN
  SELECT * INTO trial_record FROM public.user_trials WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- No trial exists yet
    result := json_build_object('has_trial', false, 'trial_active', false, 'time_left', 0);
    RETURN result;
  END IF;
  
  -- Auto-expire if time is up
  IF trial_record.status = 'active' AND trial_record.expires_at <= now() THEN
    UPDATE public.user_trials SET status = 'expired' WHERE user_id = p_user_id;
    result := json_build_object('has_trial', true, 'trial_active', false, 'time_left', 0);
    RETURN result;
  END IF;
  
  IF trial_record.status = 'expired' THEN
    result := json_build_object('has_trial', true, 'trial_active', false, 'time_left', 0);
  ELSE
    result := json_build_object(
      'has_trial', true,
      'trial_active', true,
      'time_left', GREATEST(0, EXTRACT(EPOCH FROM (trial_record.expires_at - now())))::int
    );
  END IF;
  
  RETURN result;
END;
$$;