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
          <a href="https://x.com/easystaking_?t=o1_QvJgFwhV5TJpzV6cqdA&s=09" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-muted-foreground hover:text-primary"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
          </a>
          <a href="https://www.instagram.com/easystaking?igsh=MXFsaThoejBsYnVkMA==" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-muted-foreground hover:text-primary"><path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.055 1.96.24 2.416.4a4.92 4.92 0 0 1 1.78 1.17 4.92 4.92 0 0 1 1.17 1.78c.16.456.345 1.246.4 2.416.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.055 1.17-.24 1.96-.4 2.416a4.92 4.92 0 0 1-1.17 1.78 4.92 4.92 0 0 1-1.78 1.17c-.456.16-1.246.345-2.416.4-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.055-1.96-.24-2.416-.4a4.92 4.92 0 0 1-1.78-1.17 4.92 4.92 0 0 1-1.17-1.78c-.16-.456-.345-1.246-.4-2.416C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.055-1.17.24-1.96.4-2.416a4.92 4.92 0 0 1 1.17-1.78A4.92 4.92 0 0 1 5.62 2.67c.456-.16 1.246-.345 2.416-.4C8.416 2.212 8.8 2.2 12 2.2zm0 1.8c-3.173 0-3.556.012-4.813.07-1.046.05-1.613.216-1.99.36a3.12 3.12 0 0 0-1.13.74 3.12 3.12 0 0 0-.74 1.13c-.144.377-.31.944-.36 1.99-.058 1.257-.07 1.64-.07 4.813s.012 3.556.07 4.813c.05 1.046.216 1.613.36 1.99.17.427.384.79.74 1.13a3.12 3.12 0 0 0 1.13.74c.377.144.944.31 1.99.36 1.257.058 1.64.07 4.813.07s3.556-.012 4.813-.07c1.046-.05 1.613-.216 1.99-.36a3.12 3.12 0 0 0 1.13-.74 3.12 3.12 0 0 0 .74-1.13c.144-.377.31-.944.36-1.99.058-1.257.07-1.64.07-4.813s-.012-3.556-.07-4.813c-.05-1.046-.216-1.613-.36-1.99a3.12 3.12 0 0 0-.74-1.13 3.12 3.12 0 0 0-1.13-.74c-.377-.144-.944-.31-1.99-.36-1.257-.058-1.64-.07-4.813-.07z"/><circle cx="12" cy="12" r="3.6"/></svg>
          </a>
          <a href="https://www.facebook.com/share/14Ljqk9xf7J/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-muted-foreground hover:text-primary"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.987h-2.54v-2.892h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.892h-2.33v6.987C18.343 21.128 22 16.991 22 12z"/></svg>
          </a>
          <a href="https://whatsapp.com/channel/0029VbBxTWRF6smqSp3SCp3d" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-muted-foreground hover:text-primary"><path d="M12 2C6.476 2 2 6.477 2 12c0 2.21.719 4.25 1.938 5.927L2 22l4.173-1.936A9.959 9.959 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-.001 18c-1.554 0-3.006-.423-4.256-1.15l-.305-.187-2.484.898.878-2.423-.2-.31A7.955 7.955 0 0 1 4.001 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.404-5.905c-.197-.098-1.16-.574-1.336-.64-.176-.067-.305-.098-.433.098s-.496.64-.608.772c-.112.133-.224.149-.412.05-.188-.099-.792-.292-1.507-.927-.557-.496-.932-1.11-1.04-1.298-.108-.188-.012-.29.086-.388.088-.087.197-.224.296-.336.099-.112.132-.187.198-.312.066-.124.033-.233-.016-.336-.05-.103-.432-1.04-.593-1.424-.156-.374-.314-.323-.433-.329l-.37-.006c-.124 0-.326.046-.497.233s-.65.635-.65 1.548c0 .912.666 1.793.758 1.918.093.124 1.31 2 3.177 2.803.444.192.79.306 1.06.393.445.142.85.122 1.17.074.356-.05 1.16-.473 1.327-.933.165-.46.165-.855.116-.933-.05-.082-.176-.124-.376-.222z"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
