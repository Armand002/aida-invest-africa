import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Pack {
  id: string;
  name: string;
  amount: number;
  weekly_return: number;
  total_return: number;
  duration_weeks: number;
}

interface Profile {
  wallet_balance: number;
}

const Packs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      await fetchPacks();
      await fetchProfile();
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const fetchPacks = async () => {
    const { data, error } = await supabase
      .from("investment_packs")
      .select("*")
      .order("amount", { ascending: true });

    if (error) {
      console.error("Error fetching packs:", error);
      return;
    }

    setPacks(data || []);
  };

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    setProfile(data);
  };

  const handleInvest = async (pack: Pack) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (!profile || profile.wallet_balance < pack.amount) {
      toast({
        title: "Solde insuffisant",
        description: "Veuillez créditer votre wallet avant de staker.",
        variant: "destructive",
      });
      return;
    }

    setInvesting(pack.id);

    // Start transaction
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ wallet_balance: profile.wallet_balance - pack.amount })
      .eq("id", user.id);

    if (updateError) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la transaction.",
        variant: "destructive",
      });
      setInvesting(null);
      return;
    }

    const { error: investError } = await supabase.from("user_investments").insert({
      user_id: user.id,
      pack_id: pack.id,
      investment_amount: pack.amount,
      weekly_return: pack.weekly_return,
      status: "active",
    });

    if (investError) {
      // Rollback
      await supabase
        .from("profiles")
        .update({ wallet_balance: profile.wallet_balance })
        .eq("id", user.id);

      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du staking.",
        variant: "destructive",
      });
      setInvesting(null);
      return;
    }

    // Log transaction
    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "investment",
      amount: pack.amount,
      status: "completed",
      notes: `Investissement dans le pack ${pack.name}`,
    });

    toast({
      title: "Staking réussi",
      description: `Vous avez staké $${pack.amount} dans le pack ${pack.name}`,
    });

    setInvesting(null);
    navigate("/dashboard");
  };

  const getPackTier = (index: number) => {
    const tiers = ["Bronze", "Argent", "Or", "Platine", "Diamant", "Elite", "Premium", "Prestige", "Ultimate"];
    return tiers[index] || "Standard";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Packs de staking</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choisissez le pack de staking qui correspond à vos objectifs.
            Tous les contrats ont une durée de 48 semaines avec des récompenses
            hebdomadaires garanties.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-soft">
            <span className="text-sm text-muted-foreground">Votre balance:</span>
            <span className="text-lg font-bold">
              ${Number(profile?.wallet_balance || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {packs.map((pack, index) => {
            const canAfford = profile && profile.wallet_balance >= pack.amount;
            const roi = ((pack.total_return / pack.amount) * 100).toFixed(0);

            return (
              <Card
                key={pack.id}
                className={`shadow-elegant transition-all duration-300 hover:scale-105 ${
                  index === 4 ? "md:col-span-2 lg:col-span-1 border-2 border-secondary" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{getPackTier(index)}</Badge>
                    {index === 4 && (
                      <Badge className="gradient-gold text-primary">
                        Populaire
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">Pack {pack.name}</CardTitle>
                  <CardDescription>
                    Montant à staker: ${Number(pack.amount).toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-transparent bg-clip-text drop-shadow-md mb-1">
                      ${Number(pack.weekly_return).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      par semaine
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent" />
                      <span>Durée: {pack.duration_weeks} semaines</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent" />
                      <span>
                        Retour total: ${Number(pack.total_return).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent" />
                      <span>ROI: +{roi}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent" />
                      <span>Capital retirable à la fin</span>
                    </div>
                  </div>

                  <Button
                    className={`w-full ${
                      index === 4
                        ? "gradient-gold text-primary font-semibold shadow-gold"
                        : ""
                    }`}
                    disabled={!canAfford || investing === pack.id}
                    onClick={() => handleInvest(pack)}
                  >
                    {investing === pack.id ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Staking en cours...
                      </>
                    ) : !canAfford ? (
                      "Solde insuffisant"
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Staker maintenant
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Packs;
