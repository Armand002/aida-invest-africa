import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet, TrendingUp, Clock, Award, Plus, ArrowUpRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Profile {
  wallet_balance: number;
  full_name: string;
  referral_code: string;
  referral_level: number;
  total_referral_volume: number;
}

interface ReferralCommission {
  id: string;
  amount: number;
  percentage: number;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Referral {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  total_invested: number;
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

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  metadata: any;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [referralCommissions, setReferralCommissions] = useState<ReferralCommission[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      await fetchProfile();
      await fetchInvestments();
      await fetchReferralCommissions();
      await fetchReferrals();
      await fetchTransactions();
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // -------------------- Fetchers --------------------
  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_balance, full_name, referral_code, referral_level, total_referral_volume")
      .eq("id", user.id)
      .single();
    if (error) console.error("Error fetching profile:", error);
    else setProfile(data);
  };

  const fetchInvestments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("user_investments")
      .select(`
        id,
        investment_amount,
        weekly_return,
        total_earned,
        current_week,
        status,
        investment_packs (name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching investments:", error);
    else setInvestments(data || []);
  };

  const fetchReferralCommissions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("referral_commissions")
      .select(`
        id,
        amount,
        percentage,
        created_at,
        referred_id,
        profiles!referral_commissions_referred_id_fkey (
          full_name,
          email
        )
      `)
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching commissions:", error);
    else setReferralCommissions(data || []);
  };

  const fetchReferrals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();
    if (!currentProfile?.referral_code) return;
    const { data: referredUsers, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("referred_by", currentProfile.referral_code);
    if (error) console.error("Error fetching referrals:", error);
    else {
      const referralsWithInvestments = await Promise.all(
        (referredUsers || []).map(async (refUser) => {
          const { data: investments } = await supabase
            .from("user_investments")
            .select("investment_amount")
            .eq("user_id", refUser.id);
          const totalInvested = investments?.reduce(
            (sum, inv) => sum + Number(inv.investment_amount),
            0
          ) || 0;
          return { ...refUser, total_invested: totalInvested };
        })
      );
      setReferrals(referralsWithInvestments);
    }
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTransactions(data);
  };

  // -------------------- Realtime Updates --------------------
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Wallet realtime
      const profileSub = supabase
        .channel(`realtime-profile-${user.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
          (payload) => setProfile((prev) => prev ? { ...prev, wallet_balance: payload.new.wallet_balance } : prev)
        )
        .subscribe();

      // Transactions realtime
      const txSub = supabase
        .channel(`realtime-transactions-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
          (payload) => setTransactions((prev) => [payload.new, ...prev])
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profileSub);
        supabase.removeChannel(txSub);
      };
    };

    setupRealtime();
  }, []);

  // -------------------- Utils --------------------
  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast({
        title: "Code copied!",
        description: "Your referral code has been copied to clipboard",
      });
    }
  };

  const totalReferralEarnings = referralCommissions.reduce((sum, comm) => sum + Number(comm.amount), 0);
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
        {/* -------------------- Wallet & Stats -------------------- */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {profile?.full_name || "Staker"}
          </h1>
          <p className="text-muted-foreground">Manage your staking positions and track your rewards</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(profile?.wallet_balance || 0).toFixed(2)}</div>
              <Button
                size="sm"
                className="mt-3 gradient-gold text-primary font-semibold shadow-gold"
                onClick={() => navigate("/deposit")}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Funds
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalInvested.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {activeInvestments} position{activeInvestments > 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">${totalEarned.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Since inception</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
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
                View Packs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* -------------------- Referral Program -------------------- */}
        <Card className="shadow-soft mb-8 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" /> Referral Program
            </CardTitle>
            <CardDescription>
              Earn {profile?.referral_level || 5}% commission on every investment from your referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Your Referral Code</p>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-lg">
                    {profile?.referral_code || "Loading..."}
                  </code>
                  <Button size="sm" onClick={copyReferralCode}>Copy</Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Commission Rate</p>
                <div className="text-2xl font-bold text-accent">
                  {profile?.referral_level || 5}%
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <div className="text-2xl font-bold">${totalReferralEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">From {referralCommissions.length} referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* -------------------- Tabs -------------------- */}
        <Tabs defaultValue="investments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="investments">My Positions</TabsTrigger>
            <TabsTrigger value="my-referrals">My Referrals</TabsTrigger>
            <TabsTrigger value="referrals">Commission History</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Investments */}
          <TabsContent value="investments" className="space-y-4">
            {investments.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Active Staking Positions</h3>
                  <p className="text-muted-foreground mb-4">Start staking today and receive weekly rewards</p>
                  <Button onClick={() => navigate("/packs")} className="gradient-gold text-primary font-semibold shadow-gold">
                    Discover Packs
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {investments.map((inv) => (
                  <Card key={inv.id} className="shadow-soft">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Pack {inv.investment_packs.name}</CardTitle>
                          <CardDescription>Week {inv.current_week} / 48</CardDescription>
                        </div>
                        <Badge variant={inv.status === "active" ? "default" : "secondary"}>
                          {inv.status === "active" ? "Active" : "Completed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Staked Amount</p>
                          <p className="font-semibold">${Number(inv.investment_amount).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Weekly Rewards</p>
                          <p className="font-semibold text-accent">${Number(inv.weekly_return).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Total Rewards</p>
                          <p className="font-semibold text-accent">${Number(inv.total_earned).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-4 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full gradient-gold transition-all duration-500"
                          style={{ width: `${(inv.current_week / 48) * 100}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Referrals */}
          <TabsContent value="my-referrals" className="space-y-4">
            {referrals.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Referrals Yet</h3>
                  <p className="text-muted-foreground mb-4">Share your referral code to start building your network</p>
                  <Button onClick={copyReferralCode} className="gradient-gold text-primary font-semibold shadow-gold">
                    Copy Referral Code
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {referrals.map((ref) => (
                  <Card key={ref.id} className="shadow-soft">
                    <CardContent className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{ref.full_name}</p>
                        <p className="text-sm text-muted-foreground">{ref.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">Joined: {new Date(ref.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Total Invested</p>
                        <p className="text-lg font-bold">${ref.total_invested.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Referral Commissions */}
          <TabsContent value="referrals" className="space-y-4">
            {referralCommissions.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Commissions Yet</h3>
                  <p className="text-muted-foreground mb-4">You'll earn commissions when your referrals invest</p>
                  <Button onClick={copyReferralCode} className="gradient-gold text-primary font-semibold shadow-gold">
                    Copy Referral Code
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {referralCommissions.map((comm) => (
                  <Card key={comm.id} className="shadow-soft">
                    <CardContent className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{comm.profiles?.full_name || "User"}</p>
                        <p className="text-sm text-muted-foreground">{comm.profiles?.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(comm.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2 text-green-600">
                          <ArrowUpRight className="w-4 h-4" />
                          <span className="font-bold">+${Number(comm.amount).toFixed(2)}</span>
                        </div>
                        <Badge variant="secondary" className="mt-1">{comm.percentage}% commission</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions">
            {transactions.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                  <p className="text-muted-foreground">All deposits and withdrawals will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <Card key={tx.id} className="shadow-soft">
                    <CardHeader className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</CardTitle>
                      <Badge variant={tx.type === "deposit" ? "default" : "secondary"}>{tx.type}</Badge>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Amount</p>
                        <p className="font-semibold">{tx.currency.startsWith("USDT") ? "$" : ""}{tx.amount.toFixed(2)} {tx.currency}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Date</p>
                        <p>{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Transaction ID</p>
                        <p className="font-mono text-xs">{tx.metadata?.txn_id || "-"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
