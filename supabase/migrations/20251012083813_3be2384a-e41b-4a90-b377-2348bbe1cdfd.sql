-- Allow users to view basic info of users they referred
CREATE POLICY "Users can view their referrals"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles AS referrer
    WHERE referrer.id = auth.uid()
    AND profiles.referred_by = referrer.referral_code
  )
);