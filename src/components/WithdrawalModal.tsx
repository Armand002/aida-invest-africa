import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownLeft, Loader2 } from "lucide-react";

interface WithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  lockedBalance: number;
  onSuccess: () => void;
}

export const WithdrawalModal = ({
  open,
  onOpenChange,
  availableBalance,
  lockedBalance,
  onSuccess,
}: WithdrawalModalProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);

    // Validation
    if (!withdrawAmount || isNaN(withdrawAmount)) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount < 1) {
      toast({
        title: "Minimum withdrawal",
        description: "Minimum withdrawal amount is $1",
        variant: "destructive",
      });
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough available balance",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from("profiles")
        .update({
          wallet_balance: availableBalance - withdrawAmount,
        })
        .eq("id", user.id);

      if (walletError) throw walletError;

      // Create withdrawal transaction
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "withdrawal",
          amount: withdrawAmount,
          status: "pending",
          notes: "Withdrawal request initiated",
        });

      if (txError) throw txError;

      toast({
        title: "Withdrawal initiated",
        description: `Your withdrawal of $${withdrawAmount.toFixed(2)} is being processed`,
      });

      setAmount("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Withdrawal failed",
        description: error.message || "An error occurred during withdrawal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-accent" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Withdraw available funds from your wallet. Minimum $1.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-lg font-bold text-accent">
                ${availableBalance.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Locked in Contracts</p>
              <p className="text-lg font-bold text-muted-foreground">
                ${lockedBalance.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal: $1.00
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount((availableBalance * 0.25).toFixed(2))}
              disabled={loading}
            >
              25%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount((availableBalance * 0.5).toFixed(2))}
              disabled={loading}
            >
              50%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount((availableBalance * 0.75).toFixed(2))}
              disabled={loading}
            >
              75%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount(availableBalance.toFixed(2))}
              disabled={loading}
            >
              Max
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={loading}
            className="gradient-gold text-primary font-semibold shadow-gold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Withdraw
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
