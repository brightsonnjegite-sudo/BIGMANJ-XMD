CREATE TABLE public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config" ON public.app_config FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage config" ON public.app_config FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.app_config (key, value) VALUES ('global_token', '');