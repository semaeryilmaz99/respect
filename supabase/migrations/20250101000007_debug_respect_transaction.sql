-- Debug respect transaction function
-- This function helps debug why artist total_respect is not updating

CREATE OR REPLACE FUNCTION debug_respect_transaction(
  p_from_user_id uuid,
  p_to_artist_id uuid,
  p_amount integer
) RETURNS TABLE (
  step text,
  result text,
  details jsonb
) AS $$
DECLARE
  current_user_balance integer;
  current_artist_respect integer;
  new_user_balance integer;
  new_artist_respect integer;
BEGIN
  -- Step 1: Check initial values
  SELECT respect_balance INTO current_user_balance 
  FROM profiles WHERE id = p_from_user_id;
  
  SELECT total_respect INTO current_artist_respect 
  FROM artists WHERE id = p_to_artist_id;
  
  RETURN QUERY SELECT 
    'Initial Values'::text,
    'OK'::text,
    jsonb_build_object(
      'user_balance', current_user_balance,
      'artist_respect', current_artist_respect,
      'user_id', p_from_user_id,
      'artist_id', p_to_artist_id,
      'amount', p_amount
    );
  
  -- Step 2: Check if user has enough balance
  IF current_user_balance < p_amount THEN
    RETURN QUERY SELECT 
      'Insufficient Balance'::text,
      'ERROR'::text,
      jsonb_build_object('error', 'User balance too low');
    RETURN;
  END IF;
  
  -- Step 3: Update user balance
  UPDATE profiles 
  SET respect_balance = respect_balance - p_amount,
      total_respect_sent = total_respect_sent + p_amount
  WHERE id = p_from_user_id;
  
  GET DIAGNOSTICS new_user_balance = ROW_COUNT;
  
  RETURN QUERY SELECT 
    'User Balance Update'::text,
    CASE WHEN new_user_balance > 0 THEN 'SUCCESS' ELSE 'FAILED' END::text,
    jsonb_build_object('rows_affected', new_user_balance);
  
  -- Step 4: Update artist respect
  UPDATE artists 
  SET total_respect = total_respect + p_amount
  WHERE id = p_to_artist_id;
  
  GET DIAGNOSTICS new_artist_respect = ROW_COUNT;
  
  RETURN QUERY SELECT 
    'Artist Respect Update'::text,
    CASE WHEN new_artist_respect > 0 THEN 'SUCCESS' ELSE 'FAILED' END::text,
    jsonb_build_object('rows_affected', new_artist_respect);
  
  -- Step 5: Check final values
  SELECT respect_balance INTO new_user_balance 
  FROM profiles WHERE id = p_from_user_id;
  
  SELECT total_respect INTO new_artist_respect 
  FROM artists WHERE id = p_to_artist_id;
  
  RETURN QUERY SELECT 
    'Final Values'::text,
    'OK'::text,
    jsonb_build_object(
      'new_user_balance', new_user_balance,
      'new_artist_respect', new_artist_respect,
      'user_balance_change', current_user_balance - new_user_balance,
      'artist_respect_change', new_artist_respect - current_artist_respect
    );
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION debug_respect_transaction(uuid, uuid, integer) TO authenticated; 