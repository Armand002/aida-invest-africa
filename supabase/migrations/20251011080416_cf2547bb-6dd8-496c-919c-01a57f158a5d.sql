-- Function to complete investment and credit wallet at week 48
CREATE OR REPLACE FUNCTION complete_investment_at_week_48()
RETURNS TRIGGER AS $$
DECLARE
  total_payout numeric;
BEGIN
  -- Check if investment just reached week 48 and is still active
  IF NEW.current_week >= 48 AND OLD.current_week < 48 AND NEW.status = 'active' THEN
    -- Calculate total payout (capital + all earnings)
    total_payout := NEW.investment_amount + NEW.total_earned;
    
    -- Credit the user's wallet
    UPDATE profiles
    SET wallet_balance = wallet_balance + total_payout
    WHERE id = NEW.user_id;
    
    -- Mark investment as completed
    NEW.status := 'completed';
    
    -- Log the transaction
    INSERT INTO wallet_transactions (
      user_id,
      type,
      amount,
      status,
      notes
    ) VALUES (
      NEW.user_id,
      'payout',
      total_payout,
      'completed',
      'Contract completion: capital + earnings returned to wallet'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run before update on user_investments
DROP TRIGGER IF EXISTS trigger_complete_investment ON user_investments;
CREATE TRIGGER trigger_complete_investment
  BEFORE UPDATE ON user_investments
  FOR EACH ROW
  EXECUTE FUNCTION complete_investment_at_week_48();