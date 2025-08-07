-- Respect Balance Güncelleme Fonksiyonu
CREATE OR REPLACE FUNCTION process_respect_transaction(
  p_from_user_id uuid,
  p_to_artist_id uuid,
  p_song_id uuid,
  p_amount integer,
  p_message text,
  p_transaction_type text
) RETURNS void AS $$
BEGIN
  -- Kullanıcının respect balance'ını kontrol et
  IF (SELECT respect_balance FROM profiles WHERE id = p_from_user_id) < p_amount THEN
    RAISE EXCEPTION 'Insufficient respect balance';
  END IF;

  -- Kullanıcıdan respect düş
  UPDATE profiles 
  SET 
    respect_balance = respect_balance - p_amount,
    total_respect_sent = total_respect_sent + p_amount
  WHERE id = p_from_user_id;

  -- Sanatçıya respect ekle
  UPDATE artists 
  SET total_respect = total_respect + p_amount
  WHERE id = p_to_artist_id;

  -- Şarkıya respect ekle (eğer şarkı transaction ise)
  IF p_song_id IS NOT NULL THEN
    UPDATE songs 
    SET total_respect = total_respect + p_amount
    WHERE id = p_song_id;
  END IF;

  -- Transaction kaydı oluştur
  INSERT INTO respect_transactions (
    from_user_id, to_artist_id, song_id, amount, message, transaction_type
  ) VALUES (
    p_from_user_id, p_to_artist_id, p_song_id, p_amount, p_message, p_transaction_type
  );

  -- Feed item oluştur (hem genel hem kişisel)
  INSERT INTO feed_items (type, user_id, artist_id, song_id, content, is_public, is_personal)
  VALUES (
    'respect_sent',
    p_from_user_id,
    p_to_artist_id,
    p_song_id,
    jsonb_build_object('amount', p_amount, 'message', p_message),
    true,
    true
  );
END;
$$ LANGUAGE plpgsql;

-- Takip Sayısı Güncelleme Trigger'ı
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Kullanıcının following_count'unu artır
    UPDATE profiles 
    SET followed_artists_count = followed_artists_count + 1
    WHERE id = NEW.user_id;
    
    -- Sanatçının followers_count'unu artır
    UPDATE artists 
    SET followers_count = followers_count + 1
    WHERE id = NEW.artist_id;
    
    -- Feed item oluştur
    INSERT INTO feed_items (type, user_id, artist_id, content, is_public, is_personal)
    VALUES (
      'artist_followed',
      NEW.user_id,
      NEW.artist_id,
      jsonb_build_object('action', 'followed'),
      true,
      true
    );
    
    -- Chat room'a otomatik katılım
    INSERT INTO chat_room_members (room_id, room_type, user_id)
    VALUES (NEW.artist_id::text, 'artist', NEW.user_id)
    ON CONFLICT (room_id, user_id) DO NOTHING;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Kullanıcının following_count'unu azalt
    UPDATE profiles 
    SET followed_artists_count = followed_artists_count - 1
    WHERE id = OLD.user_id;
    
    -- Sanatçının followers_count'unu azalt
    UPDATE artists 
    SET followers_count = followers_count - 1
    WHERE id = OLD.artist_id;
    
    -- Chat room'dan çıkış
    DELETE FROM chat_room_members 
    WHERE room_id = OLD.artist_id::text AND user_id = OLD.user_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Favori Sayısı Güncelleme Trigger'ı
CREATE OR REPLACE FUNCTION update_favorite_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Kullanıcının favorite_songs_count'unu artır
    UPDATE profiles 
    SET favorite_songs_count = favorite_songs_count + 1
    WHERE id = NEW.user_id;
    
    -- Şarkının favorites_count'unu artır
    UPDATE songs 
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.song_id;
    
    -- Feed item oluştur
    INSERT INTO feed_items (type, user_id, song_id, content, is_public, is_personal)
    VALUES (
      'song_favorited',
      NEW.user_id,
      NEW.song_id,
      jsonb_build_object('action', 'favorited'),
      true,
      true
    );
    
    -- Chat room'a otomatik katılım
    INSERT INTO chat_room_members (room_id, room_type, user_id)
    VALUES (NEW.song_id::text, 'song', NEW.user_id)
    ON CONFLICT (room_id, user_id) DO NOTHING;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Kullanıcının favorite_songs_count'unu azalt
    UPDATE profiles 
    SET favorite_songs_count = favorite_songs_count - 1
    WHERE id = OLD.user_id;
    
    -- Şarkının favorites_count'unu azalt
    UPDATE songs 
    SET favorites_count = favorites_count - 1
    WHERE id = OLD.song_id;
    
    -- Chat room'dan çıkış
    DELETE FROM chat_room_members 
    WHERE room_id = OLD.song_id::text AND user_id = OLD.user_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Chat Room Oluşturma Fonksiyonu
CREATE OR REPLACE FUNCTION create_chat_room_if_not_exists(
  p_room_id text,
  p_room_type text,
  p_room_name text DEFAULT NULL,
  p_room_description text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Chat room yoksa oluştur
  INSERT INTO chat_rooms (room_id, room_type, room_name, room_description)
  VALUES (p_room_id, p_room_type, p_room_name, p_room_description)
  ON CONFLICT (room_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Profil Tamamlama Fonksiyonu
CREATE OR REPLACE FUNCTION complete_user_profile(
  p_user_id uuid,
  p_username text,
  p_full_name text,
  p_bio text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Profil bilgilerini güncelle
  UPDATE profiles 
  SET 
    username = p_username,
    full_name = p_full_name,
    bio = p_bio,
    avatar_url = p_avatar_url,
    is_profile_completed = true,
    profile_completed_at = now(),
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Profil tamamlama feed item'ı oluştur
  INSERT INTO feed_items (type, user_id, content, is_public, is_personal)
  VALUES (
    'profile_completed',
    p_user_id,
    jsonb_build_object('username', p_username, 'full_name', p_full_name),
    true,
    true
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger'ları oluştur
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON artist_follows;
CREATE TRIGGER trigger_update_follow_counts
    AFTER INSERT OR DELETE ON artist_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follow_counts();

DROP TRIGGER IF EXISTS trigger_update_favorite_counts ON song_favorites;
CREATE TRIGGER trigger_update_favorite_counts
    AFTER INSERT OR DELETE ON song_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_favorite_counts(); 