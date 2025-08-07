-- Create user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  stat_type text check (stat_type in (
    'daily_respect_sent',
    'weekly_respect_sent', 
    'monthly_respect_sent',
    'total_respect_sent',
    'daily_respect_received',
    'weekly_respect_received',
    'monthly_respect_received',
    'total_respect_received',
    'chat_messages_sent',
    'favorites_added',
    'artists_followed'
  )),
  stat_value bigint default 0,
  stat_date date,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  
  -- Her kullanıcı için günlük istatistik tekrarını engelle
  UNIQUE(user_id, stat_type, stat_date)
);

-- Create daily_bonuses table
CREATE TABLE IF NOT EXISTS public.daily_bonuses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  bonus_amount integer not null,
  bonus_type text check (bonus_type in ('daily_login', 'streak_bonus', 'special_event')),
  claimed_at timestamp default now(),
  claim_date date default current_date,
  
  -- Her kullanıcı günde bir kez bonus alabilir
  UNIQUE(user_id, claim_date)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text check (type in (
    'respect_received',
    'new_follower',
    'chat_message',
    'daily_bonus',
    'milestone_reached',
    'system_announcement',
    'new_chat_room_member'
  )),
  title text not null,
  message text not null,
  data jsonb, -- Ek veri (artist_id, song_id, amount vb.)
  is_read boolean default false,
  read_at timestamp,
  created_at timestamp default now()
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  activity_type text check (activity_type in (
    'login',
    'profile_update',
    'respect_sent',
    'artist_followed',
    'song_favorited',
    'chat_message_sent',
    'daily_bonus_claimed'
  )),
  activity_data jsonb, -- Aktivite detayları
  ip_address inet,
  user_agent text,
  created_at timestamp default now()
);

-- Enable RLS for all tables
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "Users can view own stats" 
ON user_stats FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" 
ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" 
ON user_stats FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for daily_bonuses
CREATE POLICY "Users can view own bonuses" 
ON daily_bonuses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bonuses" 
ON daily_bonuses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON notifications FOR INSERT WITH CHECK (true);

-- RLS Policies for user_activities
CREATE POLICY "Users can view own activities" 
ON user_activities FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" 
ON user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_user_stats_stat_type ON user_stats(stat_type);
CREATE INDEX idx_user_stats_stat_date ON user_stats(stat_date);

CREATE INDEX idx_daily_bonuses_user_id ON daily_bonuses(user_id);
CREATE INDEX idx_daily_bonuses_claim_date ON daily_bonuses(claim_date);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at); 