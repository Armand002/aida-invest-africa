import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet, TrendingUp, Clock, Award, Plus, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WithdrawalModal } from "@/components/WithdrawalModal";

interface Profile {
  wallet_balance: number;
  full_name: string;
  referral_code: string;
  referral_level: number;
  total_referral_volume: number;
  released_capital: number;
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
  status: string;
  notes?: string;
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
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);

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
      .select("wallet_balance, full_name, referral_code, referral_level, total_referral_volume, released_capital")
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setTransactions(data);
  };

  // -------------------- Realtime Updates --------------------
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profileSub = supabase
        .channel(`realtime-profile-${user.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
          (payload) => setProfile((prev) => prev ? { ...prev, wallet_balance: payload.new.wallet_balance } : prev)
        )
        .subscribe();

      const txSub = supabase
        .channel(`realtime-transactions-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${user.id}` },
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
  const lockedBalance = investments.filter((inv) => inv.status === "active").reduce((sum, inv) => sum + Number(inv.investment_amount), 0);
  const availableBalance = Number(profile?.wallet_balance || 0);
  const releasedCapital = Number(profile?.released_capital || 0);
  const withdrawableBalance = totalEarned + totalReferralEarnings + releasedCapital;

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

  // -------------------- Sub-components --------------------
  const ScrollSection = ({ children }: { children: React.ReactNode }) => (
    <div className="max-h-[500px] overflow-y-auto pr-2">{children}</div>
  );

  const TransactionList = ({ items, emptyLabel }: { items: any[]; emptyLabel: string }) => (
    <ScrollSection>
      {items.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{emptyLabel}</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((tx) => (
            <Card key={tx.id} className="shadow-soft">
              <CardContent className="py-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1).replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={tx.status === "completed" ? "default" : "secondary"}>{tx.status}</Badge>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold">
                      {tx.type === "deposit" || tx.type === "referral_commission" || tx.type === "payout"
                        ? "+"
                        : "-"}
                      ${Number(tx.amount).toFixed(2)}
                    </p>
                  </div>
                  {tx.notes && <p className="text-xs text-muted-foreground max-w-xs text-right">{tx.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ScrollSection>
  );

  const roiTx = transactions.filter((tx) => tx.type === "return");
  const deposits = transactions.filter((tx) => tx.type === "deposit");
  const withdrawals = transactions.filter((tx) => tx.type === "withdrawal");
  const investmentTx = transactions.filter((tx) => tx.type === "investment");

  // -------------------- Render --------------------
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* ---- HEADER ---- */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.full_name || "Staker"}</h1>
          <p className="text-muted-foreground">Manage your staking positions and track your rewards</p>
        </div>

        {/* ---- BALANCES ---- */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Wallet */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${availableBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Locked: ${lockedBalance.toFixed(2)}</p>
              <Button size="sm" className="gradient-gold text-primary font-semibold shadow-gold w-full mt-3" onClick={() => navigate("/deposit")}>
                <Plus className="w-4 h-4 mr-1" /> Deposit
              </Button>
            </CardContent>
          </Card>

          {/* Total staked */}
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

          {/* Earnings */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">${totalEarned.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Commissions: ${totalReferralEarnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Released Capital: ${releasedCapital.toFixed(2)}</p>
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setWithdrawalOpen(true)} disabled={withdrawableBalance < 1}>
                <ArrowDownLeft className="w-4 h-4 mr-1" /> Withdraw
              </Button>
            </CardContent>
          </Card>

          {/* Active */}
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeInvestments}</div>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate("/packs")}>
                View Packs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ---- REFERRAL PROGRAM ---- */}
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
                <div className="text-2xl font-bold text-accent">{profile?.referral_level || 5}%</div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <div className="text-2xl font-bold">${totalReferralEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">From {referralCommissions.length} referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---- MAIN TABS ---- */}
        <Tabs defaultValue="investments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="investments">My Positions</TabsTrigger>
            <TabsTrigger value="my-referrals">My Referrals</TabsTrigger>
            <TabsTrigger value="referrals">Commission History</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* ---- Investments ---- */}
          <TabsContent value="investments">
            <ScrollSection>
              {investments.length === 0 ? (
                <Card className="shadow-soft">
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No active investments</h3>
                    <p className="text-muted-foreground mb-4">Start earning passive income today.</p>
                    <Button onClick={() => navigate("/packs")}>View Investment Packs</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {investments.map((inv) => (
                    <Card key={inv.id} className="shadow-soft border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{inv.investment_packs.name}</span>
                          <Badge variant={inv.status === "active" ? "default" : "secondary"}>
                            {inv.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p>Amount: <strong>${inv.investment_amount.toFixed(2)}</strong></p>
                          <p>Weekly Return: <strong>${inv.weekly_return.toFixed(2)}</strong></p>
                          <p>Total Earned: <strong>${inv.total_earned.toFixed(2)}</strong></p>
                          <p>Week: {inv.current_week}/48</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollSection>
          </TabsContent>

          {/* ---- My Referrals ---- */}
          <TabsContent value="my-referrals">
            <ScrollSection>
              {referrals.length === 0 ? (
                <Card className="shadow-soft">
                  <CardContent className="py-12 text-center">
                    <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No referrals yet</h3>
                    <p className="text-muted-foreground">Share your referral code to start earning commissions.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {referrals.map((ref) => (
                    <Card key={ref.id} className="shadow-soft">
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          {ref.full_name}
                          <Badge variant="secondary">${ref.total_invested.toFixed(2)}</Badge>
                        </CardTitle>
                        <CardDescription>{ref.email}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(ref.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollSection>
          </TabsContent>

          {/* ---- Commissions ---- */}
          <TabsContent value="referrals">
            <ScrollSection>
              {referralCommissions.length === 0 ? (
                <Card className="shadow-soft">
                  <CardContent className="py-12 text-center">
                    <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No commissions earned yet</h3>
                    <p className="text-muted-foreground">Invite your friends to earn commissions.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {referralCommissions.map((comm) => (
                    <Card key={comm.id} className="shadow-soft">
                      <CardContent className="py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{comm.profiles.full_name}</p>
                            <p className="text-xs text-muted-foreground">{comm.profiles.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-accent">
                              +${comm.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">{comm.percentage}% commission</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(comm.created_at).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollSection>
          </TabsContent>

          {/* ---- Transactions ---- */}
          <TabsContent value="transactions">
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="roi">ROI</TabsTrigger>
                <TabsTrigger value="deposit">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
                <TabsTrigger value="investment">Investments</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <TransactionList items={transactions} emptyLabel="No transactions yet" />
              </TabsContent>

              <TabsContent value="deposit">
                <TransactionList items={deposits} emptyLabel="No deposits found" />
              </TabsContent>

              <TabsContent value="withdrawal">
                <TransactionList items={withdrawals} emptyLabel="No withdrawals yet" />
              </TabsContent>

              <TabsContent value="investment">
                <TransactionList items={investmentTx} emptyLabel="No investment transactions" />
              </TabsContent>

              <TabsContent value="roi">
                <TransactionList items={roiTx} emptyLabel="No ROI transactions yet" />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
      <WithdrawalModal open={withdrawalOpen} onOpenChange={setWithdrawalOpen} />
    </div>
  );
};

export default Dashboard;
