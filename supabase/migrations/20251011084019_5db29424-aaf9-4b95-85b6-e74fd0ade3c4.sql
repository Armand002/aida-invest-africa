-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Générer un code aléatoire de 8 caractères
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Fonction pour calculer le pourcentage de commission selon le volume
CREATE OR REPLACE FUNCTION calculate_referral_percentage(total_volume numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF total_volume >= 100000 THEN
    RETURN 15;
  ELSIF total_volume >= 10000 THEN
    RETURN 10;
  ELSE
    RETURN 5;
  END IF;
END;
$$;

-- Trigger pour générer un code de parrainage lors de la création d'un profil
CREATE OR REPLACE FUNCTION handle_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Générer un code de parrainage si il n'y en a pas
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_generate_referral_code ON profiles;
CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_code();

-- Fonction pour calculer et attribuer les commissions de parrainage
CREATE OR REPLACE FUNCTION process_referral_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_id_var uuid;
  referrer_code text;
  current_volume numeric;
  commission_pct numeric;
  commission_amount numeric;
BEGIN
  -- Récupérer le parrain du filleul
  SELECT referred_by INTO referrer_code
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Si pas de parrain, on sort
  IF referrer_code IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer l'ID du parrain
  SELECT id INTO referrer_id_var
  FROM profiles
  WHERE referral_code = referrer_code;
  
  -- Si le parrain n'existe pas, on sort
  IF referrer_id_var IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Mettre à jour le volume total du parrain
  UPDATE profiles
  SET total_referral_volume = COALESCE(total_referral_volume, 0) + NEW.investment_amount
  WHERE id = referrer_id_var
  RETURNING total_referral_volume INTO current_volume;
  
  -- Calculer le pourcentage de commission
  commission_pct := calculate_referral_percentage(current_volume);
  
  -- Mettre à jour le niveau de parrainage
  UPDATE profiles
  SET referral_level = commission_pct
  WHERE id = referrer_id_var;
  
  -- Calculer le montant de la commission
  commission_amount := NEW.investment_amount * (commission_pct / 100);
  
  -- Créditer le wallet du parrain
  UPDATE profiles
  SET wallet_balance = wallet_balance + commission_amount
  WHERE id = referrer_id_var;
  
  -- Enregistrer la commission
  INSERT INTO referral_commissions (
    referrer_id,
    referred_id,
    investment_id,
    amount,
    percentage
  ) VALUES (
    referrer_id_var,
    NEW.user_id,
    NEW.id,
    commission_amount,
    commission_pct
  );
  
  -- Enregistrer la transaction
  INSERT INTO wallet_transactions (
    user_id,
    type,
    amount,
    status,
    notes
  ) VALUES (
    referrer_id_var,
    'referral_commission',
    commission_amount,
    'completed',
    'Commission de parrainage: ' || commission_pct || '% sur investissement de $' || NEW.investment_amount
  );
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour les commissions de parrainage
DROP TRIGGER IF EXISTS trigger_referral_commission ON user_investments;
CREATE TRIGGER trigger_referral_commission
  AFTER INSERT ON user_investments
  FOR EACH ROW
  EXECUTE FUNCTION process_referral_commission();