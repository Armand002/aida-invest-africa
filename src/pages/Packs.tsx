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
        title: "Insufficient Balance",
        description: "Please add funds to your wallet before staking.",
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
        title: "Error",
        description: "An error occurred during the transaction.",
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
        title: "Error",
        description: "An error occurred during staking.",
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
      notes: `Staking in ${pack.name} pack`,
    });

    toast({
      title: "Staking Successful",
      description: `You have staked $${pack.amount} in ${pack.name} pack`,
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
            <p className="text-muted-foreground">Loading...</p>
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
          <h1 className="text-4xl font-bold mb-4">Staking Packs</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the staking pack that matches your goals.
            All contracts have a 48-week duration with guaranteed
            weekly rewards.
          </p>
          <div className="mt-4 max-w-2xl mx-auto bg-accent/10 border border-accent/20 rounded-lg p-4">
            <p className="text-sm text-center">
              <strong className="text-accent">Important:</strong> At the end of the 48-week period, 
              your initial capital plus all accumulated earnings will be automatically credited to your wallet.
            </p>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-soft">
            <span className="text-sm text-muted-foreground">Your balance:</span>
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
                        Popular
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">Pack {pack.name}</CardTitle>
                  <CardDescription>
                    Amount to stake: ${Number(pack.amount).toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-transparent bg-clip-text drop-shadow-md mb-1">
                      ${Number(pack.weekly_return).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      per week
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent" />
                      <span>Duration: {pack.duration_weeks} weeks</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent" />
                      <span>
                        Total return: ${Number(pack.total_return).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent" />
                      <span>ROI: +{roi}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent" />
                      <span>Capital + earnings returned after 48 weeks</span>
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
                        Staking...
                      </>
                    ) : !canAfford ? (
                      "Insufficient Balance"
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Stake Now
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
