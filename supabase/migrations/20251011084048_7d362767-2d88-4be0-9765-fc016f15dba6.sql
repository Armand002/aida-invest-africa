-- Activer RLS sur la table referral_commissions
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres commissions (en tant que parrain)
CREATE POLICY "Users can view commissions they earned"
ON referral_commissions
FOR SELECT
USING (auth.uid() = referrer_id);

-- Les utilisateurs peuvent voir les commissions liées à leurs investissements (en tant que filleul)
CREATE POLICY "Users can view commissions from their investments"
ON referral_commissions
FOR SELECT
USING (auth.uid() = referred_id);