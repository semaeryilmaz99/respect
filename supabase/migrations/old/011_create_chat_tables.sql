-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid primary key default uuid_generate_v4(),
  room_id text not null unique, -- artist_id veya song_id
  room_type text check (room_type in ('artist', 'song')),
  room_name text,
  room_description text,
  member_count integer default 0,
  last_message_at timestamp,
  is_active boolean default true,
  created_at timestamp default now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  room_id text not null, -- artist_id veya song_id
  room_type text check (room_type in ('artist', 'song')),
  user_id uuid references auth.users(id) on delete cascade,
  message text not null,
  message_type text check (message_type in ('text', 'image', 'gif', 'emoji')) default 'text',
  is_edited boolean default false,
  edited_at timestamp,
  is_deleted boolean default false,
  deleted_at timestamp,
  created_at timestamp default now()
);

-- Create chat_room_members table
CREATE TABLE IF NOT EXISTS public.chat_room_members (
  id uuid primary key default uuid_generate_v4(),
  room_id text not null,
  room_type text check (room_type in ('artist', 'song')),
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamp default now(),
  is_active boolean default true,
  
  -- Her kullanıcı bir odaya sadece bir kez katılabilir
  UNIQUE(room_id, user_id)
);

-- Enable RLS for chat_rooms
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
CREATE POLICY "Chat rooms are viewable by everyone" 
ON chat_rooms FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create chat rooms" 
ON chat_rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Chat messages are viewable by everyone" 
ON chat_messages FOR SELECT USING (true);

CREATE POLICY "Users can send own messages" 
ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages" 
ON chat_messages FOR UPDATE USING (auth.uid() = user_id);

-- Enable RLS for chat_room_members
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_room_members
CREATE POLICY "Chat room members are viewable by everyone" 
ON chat_room_members FOR SELECT USING (true);

CREATE POLICY "Users can manage own memberships" 
ON chat_room_members FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_chat_rooms_room_id ON chat_rooms(room_id);
CREATE INDEX idx_chat_rooms_room_type ON chat_rooms(room_type);
CREATE INDEX idx_chat_rooms_is_active ON chat_rooms(is_active);

CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_room_type ON chat_messages(room_type);

CREATE INDEX idx_chat_room_members_room_id ON chat_room_members(room_id);
CREATE INDEX idx_chat_room_members_user_id ON chat_room_members(user_id);
CREATE INDEX idx_chat_room_members_room_type ON chat_room_members(room_type); 