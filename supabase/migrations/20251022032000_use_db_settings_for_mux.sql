-- Update get_mux_asset_duration to call Edge Function helper
-- The Edge Function has access to MUX_TOKEN_ID and MUX_TOKEN_SECRET from supabase/functions/.env

CREATE OR REPLACE FUNCTION get_mux_asset_duration(asset_id TEXT)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  duration_value DECIMAL;
  response_body TEXT;
  response_json JSON;
BEGIN
  -- Get the Supabase URL from environment (available by default)
  edge_function_url := current_setting('supabase.url', true) || '/functions/v1/mux-get-duration';
  
  -- Call Edge Function helper which has access to Mux credentials
  SELECT content::text
  INTO response_body
  FROM http((
    'POST',
    edge_function_url,
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true))
    ],
    'application/json',
    json_build_object('asset_id', asset_id)::text
  )::http_request);
  
  -- Parse response
  response_json := response_body::json;
  duration_value := (response_json->>'duration')::DECIMAL;
  
  RETURN duration_value;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fetching duration via Edge Function: %', SQLERRM;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION get_mux_asset_duration(TEXT) IS 'Fetches current duration from Mux API for live assets by calling the mux-get-duration Edge Function';

