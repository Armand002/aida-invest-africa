import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Wallet, Coins, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Deposit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    };
    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const createPayment = useCallback(async () => {
    if (!user || !session) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer un dépôt.",
        variant: "destructive",
      });
      return;
    }

    if (amount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const bodyPayload = {
        amount,
        currency: "USDT",
        network: "BEP20",
        user_id: user.id,
        user_email: user.email,
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(bodyPayload),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur serveur (${response.status}) : ${text}`);
      }

      const data = await response.json();
      if (data.checkout_url) {
        toast({
          title: "Redirection...",
          description: "Vous allez être redirigé vers la page de paiement.",
        });
        window.location.href = data.checkout_url;
      } else {
        throw new Error("URL de paiement introuvable.");
      }
    } catch (err: any) {
      console.error("Erreur createPayment:", err);
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, session, amount, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-border bg-card/60 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-3">
            <Wallet className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Add Funds</CardTitle>
          <CardDescription>Deposit <strong>USDT (BEP20)</strong> only.</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Montant */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-muted-foreground">
              Amount (USD)
            </label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-lg font-medium"
            />
          </div>

          {/* Détails de crypto */}
          <div className="bg-muted/40 border rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="w-6 h-6 text-accent" />
              <div>
                <p className="font-semibold text-base">USDT</p>
                <p className="text-xs text-muted-foreground">Network : BEP20 (Binance Smart Chain)</p>
              </div>
            </div>
          </div>

          {/* Bouton principal */}
          <Button
            onClick={createPayment}
            disabled={loading || !session || !user}
            className="w-full py-3 text-base font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating payment...
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Pay Now
              </>
            )}
          </Button>

          {/* Autres actions */}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => navigate("/packs")}
            >
              Packs
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-6">
            ⚠️ Only USDT deposits on the BEP20 network are accepted.
          </p>
        </CardContent>
      </Card>

      {/* Follow Us */}
      <div className="mt-12 text-center">
        <h3 className="text-lg font-semibold mb-4">Join us on social media</h3>
        <div className="flex justify-center gap-6">
          <a href="https://x.com/easystaking__?t=pMElK3yf4hTk3TDma67V4A&s=09" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-muted-foreground hover:text-primary"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
