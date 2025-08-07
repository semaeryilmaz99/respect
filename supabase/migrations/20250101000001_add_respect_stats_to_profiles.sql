-- Add respect statistics columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_respect_sent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_respect_received integer DEFAULT 0;

-- Update existing profiles to have default values
UPDATE public.profiles 
SET 
  total_respect_sent = COALESCE(total_respect_sent, 0),
  total_respect_received = COALESCE(total_respect_received, 0)
WHERE total_respect_sent IS NULL OR total_respect_received IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_total_respect_sent ON profiles(total_respect_sent);
CREATE INDEX IF NOT EXISTS idx_profiles_total_respect_received ON profiles(total_respect_received);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.total_respect_sent IS 'Total amount of respect sent by the user';
COMMENT ON COLUMN public.profiles.total_respect_received IS 'Total amount of respect received by the user'; 