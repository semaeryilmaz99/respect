-- Fix process_respect_transaction function
-- Make it more robust and handle feed_items errors gracefully

-- First drop the existing function
DROP FUNCTION IF EXISTS process_respect_transaction(uuid, uuid, uuid, integer, text, text);

-- Then create the new function
CREATE OR REPLACE FUNCTION process_respect_transaction(
  p_from_user_id uuid,
  p_to_artist_id uuid,
  p_song_id uuid,
  p_amount integer,
  p_message text,
  p_transaction_type text
) RETURNS void AS $$
DECLARE
  transaction_id uuid;
BEGIN
  -- Check if user has enough balance
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_from_user_id AND respect_balance >= p_amount
  ) THEN
    RAISE EXCEPTION 'Insufficient respect balance';
  END IF;

  -- Start transaction
  BEGIN
    -- Update user balance and stats
    UPDATE profiles 
    SET respect_balance = respect_balance - p_amount,
        total_respect_sent = total_respect_sent + p_amount
    WHERE id = p_from_user_id;

    -- Update artist total respect
    UPDATE artists 
    SET total_respect = total_respect + p_amount
    WHERE id = p_to_artist_id;

    -- Update song total respect (if song transaction)
    IF p_song_id IS NOT NULL THEN
      UPDATE songs 
      SET total_respect = total_respect + p_amount
      WHERE id = p_song_id;
    END IF;

    -- Create transaction record
    INSERT INTO respect_transactions (
      from_user_id, to_artist_id, song_id, amount, message, transaction_type
    ) VALUES (
      p_from_user_id, p_to_artist_id, p_song_id, p_amount, p_message, p_transaction_type
    ) RETURNING id INTO transaction_id;

    -- Create feed item (with error handling)
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the transaction
      RAISE WARNING 'Failed to create feed item: %', SQLERRM;
    END;

  EXCEPTION WHEN OTHERS THEN
    -- Rollback on any error
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_respect_transaction(uuid, uuid, uuid, integer, text, text) TO authenticated; 