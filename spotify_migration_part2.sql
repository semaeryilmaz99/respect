-- Spotify Integration Database Schema Updates - Part 2 (RLS Policies)
-- Run this migration to add RLS policies for Spotify tables

-- RLS policies for spotify_connections (with IF NOT EXISTS check)
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'spotify_connections' 
        AND policyname = 'Users can view their own spotify connections'
    ) THEN
        CREATE POLICY "Users can view their own spotify connections" ON spotify_connections
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'spotify_connections' 
        AND policyname = 'Users can insert their own spotify connections'
    ) THEN
        CREATE POLICY "Users can insert their own spotify connections" ON spotify_connections
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'spotify_connections' 
        AND policyname = 'Users can update their own spotify connections'
    ) THEN
        CREATE POLICY "Users can update their own spotify connections" ON spotify_connections
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'spotify_connections' 
        AND policyname = 'Users can delete their own spotify connections'
    ) THEN
        CREATE POLICY "Users can delete their own spotify connections" ON spotify_connections
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS policies for spotify_sync_logs (with IF NOT EXISTS check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'spotify_sync_logs' 
        AND policyname = 'Users can view their own sync logs'
    ) THEN
        CREATE POLICY "Users can view their own sync logs" ON spotify_sync_logs
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'spotify_sync_logs' 
        AND policyname = 'Users can insert their own sync logs'
    ) THEN
        CREATE POLICY "Users can insert their own sync logs" ON spotify_sync_logs
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
