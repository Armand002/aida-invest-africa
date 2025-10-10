import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Clock, Award, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Profile {
  wallet_balance: number;
  full_name: string;
}

interface Investment {
  id: string;
  investment_amount: number;
  weekly_return: number;
  total_earned: number;
  current_week: number;
  status: string;
  investment_packs: {
    name: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      await fetchProfile();
      await fetchInvestments();
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_balance, full_name")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    setProfile(data);
  };

  const fetchInvestments = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_investments")
      .select(
        `
        id,
        investment_amount,
        weekly_return,
        total_earned,
        current_week,
        status,
        investment_packs (name)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching investments:", error);
      return;
    }

    setInvestments(data || []);
  };

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.investment_amount), 0);
  const totalEarned = investments.reduce((sum, inv) => sum + Number(inv.total_earned), 0);
  const activeInvestments = investments.filter((inv) => inv.status === "active").length;

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Bienvenue, {profile?.full_name || "Staker"}
          </h1>
          <p className="text-muted-foreground">
            Gérez vos positions de staking et suivez vos récompenses
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance du wallet</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Number(profile?.wallet_balance || 0).toFixed(2)}
              </div>
              <Button
                size="sm"
                className="mt-3 gradient-gold text-primary font-semibold shadow-gold"
                onClick={() => toast({ title: "Fonction bientôt disponible" })}
              >
                <Plus className="w-4 h-4 mr-1" />
                Créditer
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total staké</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalInvested.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Réparti sur {activeInvestments} position
                {activeInvestments > 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total gagné</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">${totalEarned.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Depuis le début
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positions actives</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeInvestments}</div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => navigate("/packs")}
              >
                Voir les packs
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="investments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="investments">Mes positions</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="investments" className="space-y-4">
            {investments.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucune position de staking active
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez à staker dès aujourd'hui et recevez des récompenses hebdomadaires
                  </p>
                  <Button
                    onClick={() => navigate("/packs")}
                    className="gradient-gold text-primary font-semibold shadow-gold"
                  >
                    Découvrir les packs
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {investments.map((investment) => (
                  <Card key={investment.id} className="shadow-soft">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Pack {investment.investment_packs.name}
                          </CardTitle>
                          <CardDescription>
                            Semaine {investment.current_week} / 48
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            investment.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {investment.status === "active" ? "Actif" : "Terminé"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Montant staké
                          </p>
                          <p className="font-semibold">
                            ${Number(investment.investment_amount).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Récompenses hebdo
                          </p>
                          <p className="font-semibold text-accent">
                            ${Number(investment.weekly_return).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Total récompenses
                          </p>
                          <p className="font-semibold text-accent">
                            ${Number(investment.total_earned).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full gradient-gold transition-all duration-500"
                          style={{
                            width: `${(investment.current_week / 48) * 100}%`,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  Historique des transactions
                </h3>
                <p className="text-muted-foreground">
                  Bientôt disponible
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
