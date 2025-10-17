-- Add a column to track released capital from completed investments
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS released_capital numeric DEFAULT 0;

-- Update the function to separate capital from earnings
CREATE OR REPLACE FUNCTION public.complete_investment_at_week_48()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_payout numeric;
BEGIN
  -- Check if investment just reached week 48 and is still active
  IF NEW.current_week >= 48 AND OLD.current_week < 48 AND NEW.status = 'active' THEN
    -- Add released capital to user's withdrawable balance
    UPDATE profiles
    SET released_capital = released_capital + NEW.investment_amount
    WHERE id = NEW.user_id;
    
    -- Mark investment as completed
    NEW.status := 'completed';
    
    -- Log the transaction for capital release
    INSERT INTO wallet_transactions (
      user_id,
      type,
      amount,
      status,
      notes
    ) VALUES (
      NEW.user_id,
      'capital_release',
      NEW.investment_amount,
      'completed',
      'Contract completion: capital released and available for withdrawal'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;