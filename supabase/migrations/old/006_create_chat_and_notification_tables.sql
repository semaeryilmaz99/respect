-- Migration: Create chat and notification tables
-- Date: 2024-01-XX

-- Chat Rooms Table
CREATE TABLE IF NOT EXISTS chat_rooms (
    room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('artist', 'song')),
    room_name VARCHAR(255) NOT NULL,
    description TEXT,
    reference_id UUID NOT NULL, -- artist_id or song_id
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    member_count INTEGER DEFAULT 0
);

-- Chat Room Members Table
CREATE TABLE IF NOT EXISTS chat_room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(room_id, user_id)
);

-- User Stats Table
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_respect_given INTEGER DEFAULT 0,
    total_respect_received INTEGER DEFAULT 0,
    total_artists_followed INTEGER DEFAULT 0,
    total_songs_favorited INTEGER DEFAULT 0,
    total_chat_messages INTEGER DEFAULT 0,
    total_daily_bonuses_claimed INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Bonuses Table
CREATE TABLE IF NOT EXISTS daily_bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bonus_date DATE NOT NULL,
    respect_amount INTEGER NOT NULL DEFAULT 100,
    is_claimed BOOLEAN DEFAULT false,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, bonus_date)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50), -- 'artist', 'song', 'user', etc.
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activities Table
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    reference_type VARCHAR(50), -- 'artist', 'song', 'user', etc.
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type_reference ON chat_rooms(room_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message ON chat_rooms(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_user_date ON daily_bonuses(user_id, bonus_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_type ON user_activities(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created ON user_activities(user_id, created_at DESC);

-- Row Level Security (RLS) Policies

-- Chat Rooms RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat rooms they are members of" ON chat_rooms
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM chat_room_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can create chat rooms" ON chat_rooms
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms" ON chat_rooms
    FOR UPDATE USING (auth.uid() = created_by);

-- Chat Room Members RLS
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships" ON chat_room_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join chat rooms" ON chat_room_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own memberships" ON chat_room_members
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can leave chat rooms" ON chat_room_members
    FOR DELETE USING (user_id = auth.uid());

-- User Stats RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" ON user_stats
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own stats" ON user_stats
    FOR UPDATE USING (user_id = auth.uid());

-- Daily Bonuses RLS
ALTER TABLE daily_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bonuses" ON daily_bonuses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can claim their own bonuses" ON daily_bonuses
    FOR UPDATE USING (user_id = auth.uid());

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- User Activities RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own activities" ON user_activities
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Triggers for automatic updates

-- Update chat room member count when members join/leave
CREATE OR REPLACE FUNCTION update_chat_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_rooms 
        SET member_count = member_count + 1,
            updated_at = NOW()
        WHERE room_id = NEW.room_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chat_rooms 
        SET member_count = member_count - 1,
            updated_at = NOW()
        WHERE room_id = OLD.room_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_room_member_count
    AFTER INSERT OR DELETE ON chat_room_members
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_room_member_count();

-- Update user stats when activities occur
CREATE OR REPLACE FUNCTION update_user_stats_on_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_activity_at
    UPDATE user_stats 
    SET last_activity_at = NOW(),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- If user_stats doesn't exist, create it
    IF NOT FOUND THEN
        INSERT INTO user_stats (user_id, last_activity_at)
        VALUES (NEW.user_id, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats_on_activity
    AFTER INSERT ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_on_activity();

-- Function to create daily bonus for user
CREATE OR REPLACE FUNCTION create_daily_bonus_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_bonuses (user_id, bonus_date, respect_amount)
    VALUES (p_user_id, CURRENT_DATE, 100)
    ON CONFLICT (user_id, bonus_date) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to claim daily bonus
CREATE OR REPLACE FUNCTION claim_daily_bonus(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    bonus_record RECORD;
    result JSON;
BEGIN
    -- Get today's bonus
    SELECT * INTO bonus_record 
    FROM daily_bonuses 
    WHERE user_id = p_user_id AND bonus_date = CURRENT_DATE;
    
    -- Check if bonus exists and not claimed
    IF NOT FOUND THEN
        -- Create bonus if doesn't exist
        PERFORM create_daily_bonus_for_user(p_user_id);
        SELECT * INTO bonus_record 
        FROM daily_bonuses 
        WHERE user_id = p_user_id AND bonus_date = CURRENT_DATE;
    END IF;
    
    IF bonus_record.is_claimed THEN
        result := json_build_object(
            'success', false,
            'message', 'Günlük bonus zaten alınmış',
            'amount', 0
        );
    ELSE
        -- Claim the bonus
        UPDATE daily_bonuses 
        SET is_claimed = true, claimed_at = NOW()
        WHERE id = bonus_record.id;
        
        -- Add respect to user
        UPDATE profiles 
        SET respect_balance = respect_balance + bonus_record.respect_amount
        WHERE id = p_user_id;
        
        -- Update user stats
        UPDATE user_stats 
        SET total_daily_bonuses_claimed = total_daily_bonuses_claimed + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        result := json_build_object(
            'success', true,
            'message', 'Günlük bonus başarıyla alındı',
            'amount', bonus_record.respect_amount
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql; 