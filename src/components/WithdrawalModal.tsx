import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WithdrawalModal({ open, onOpenChange, onSuccess }: WithdrawalModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [maxWithdrawable, setMaxWithdrawable] = useState(0);

  useEffect(() => {
    if (!open) return;
    const fetchWithdrawable = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch all balances in parallel
        const [investmentsRes, profileRes, commissionsRes] = await Promise.all([
          supabase.from("user_investments").select("total_earned").eq("user_id", user.id),
          supabase.from("profiles").select("released_capital").eq("id", user.id).single(),
          supabase.from("referral_commissions").select("amount").eq("referrer_id", user.id),
        ]);

        const totalEarned = investmentsRes.data?.reduce((sum, inv) => sum + Number(inv.total_earned), 0) || 0;
        const totalCommissions = commissionsRes.data?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        const releasedCapital = Number(profileRes.data?.released_capital || 0);

        setMaxWithdrawable(totalEarned + totalCommissions + releasedCapital);
      } catch (err) {
        console.error("Error fetching withdrawable balance:", err);
        setMaxWithdrawable(0);
      }
    };
    fetchWithdrawable();
  }, [open]);

  const handleWithdraw = async () => {
    if (!amount || !address) {
      toast({ title: "Missing information", description: "Please enter amount and address.", variant: "destructive" });
      return;
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid number.", variant: "destructive" });
      return;
    }

    if (amountNum > maxWithdrawable) {
      toast({ title: "Insufficient balance", description: "Amount exceeds available balance.", variant: "destructive" });
      return;
    }

    // ✅ Only BEP20 addresses allowed (USDT.BEP20)
    const bep20Regex = /^0x[a-fA-F0-9]{40}$/;
    if (!bep20Regex.test(address)) {
      toast({ title: "Invalid address", description: "Enter a valid USDT.BEP20 address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const sessionRes = await supabase.auth.getSession();
      const jwt = sessionRes.data?.session?.access_token;
      if (!jwt) throw new Error("User not authenticated");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/request-withdrawal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ amount: amountNum, address, network: "BEP20" }), // Locked to BEP20
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Withdrawal failed");
      }

      await response.json();
      toast({ title: "Withdrawal Requested", description: "Your USDT.BEP20 withdrawal request is being processed." });

      setAmount("");
      setAddress("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit withdrawal.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Available to withdraw: <span className="font-semibold">${maxWithdrawable.toFixed(2)}</span>
          </p>

          <Input
            type="number"
            placeholder="Amount (USDT)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={maxWithdrawable}
            disabled={loading}
          />

          <Input
            type="text"
            placeholder="Wallet address (USDT.BEP20)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />

          {/* Network selector removed — only BEP20 allowed */}
          <div className="text-sm font-medium text-muted-foreground">
            Network: <span className="font-semibold">USDT.BEP20</span>
          </div>

          <Button
            className="w-full gradient-gold text-primary font-semibold shadow-gold"
            onClick={handleWithdraw}
            disabled={loading || maxWithdrawable <= 0}
          >
            {loading ? "Processing..." : "Confirm Withdrawal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
