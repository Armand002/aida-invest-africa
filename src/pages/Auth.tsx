import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Mail, Lock, User } from "lucide-react";
import Navbar from "@/components/Navbar";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isResetting, setIsResetting] = useState(false); // <--- NOUVEL ÉTAT

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          referral_code: referralCode || null,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (!error && authData.user) {
      // Créer ou mettre à jour le profil avec le code de parrainage
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          full_name: fullName,
          referred_by: referralCode || null,
          email: email
        });

      if (profileError) {
        toast({
          title: "Profile Error",
          description: profileError.message,
          variant: "destructive",
        });
      }
    }

    if (error) {
      toast({
        title: "Registration Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registration Successful",
        description: "Check your email to confirm your account.",
      });
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Login Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login Successful",
        description: "Welcome to EasyStaking",
      });
      navigate("/dashboard");
    }

    setLoading(false);
  };

  // --- NOUVELLE FONCTION DE RÉINITIALISATION ---
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Envoi de l'e-mail de réinitialisation
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // L'utilisateur est redirigé vers cette route après avoir cliqué sur le lien
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      toast({
        title: "Password Reset Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email Sent",
        description: "Check your email for the password reset link.",
      });
      // Réinitialiser l'affichage pour revenir à la connexion
      setIsResetting(false);
    }

    setLoading(false);
  };
  // ---------------------------------------------


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-gold flex items-center justify-center shadow-gold">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to EasyStaking</h1>
            <p className="text-muted-foreground">
              Your secure crypto staking platform
            </p>
          </div>

          {/* --- RENDU CONDITIONNEL : Formulaire de Reset OU Formulaire d'Auth --- */}
          {isResetting ? (
            <Card className="shadow-elegant">
                <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>
                        Enter your email to receive a password reset link.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full gradient-gold text-primary font-semibold shadow-gold"
                            disabled={loading || !email}
                        >
                            {loading ? "Sending email..." : "Send Reset Link"}
                        </Button>
                        <Button
                            type="button"
                            variant="link"
                            className="w-full text-sm"
                            onClick={() => {
                                setIsResetting(false);
                                setEmail("");
                            }}
                        >
                            ← Back to Sign In
                        </Button>
                    </form>
                </CardContent>
            </Card>
          ) : (
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Account Access</CardTitle>
                <CardDescription>
                  Sign in or create an account to start staking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      {/* --- AJOUT DU LIEN DE MOT DE PASSE OUBLIÉ --- */}
                      <div className="text-right">
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-sm font-normal text-muted-foreground hover:text-primary"
                          onClick={() => setIsResetting(true)}
                        >
                          Forgot Password?
                        </Button>
                      </div>
                      {/* --------------------------------------------- */}
                      
                      <Button
                        type="submit"
                        className="w-full gradient-gold text-primary font-semibold shadow-gold"
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    {/* ... (Le formulaire d'inscription reste inchangé) ... */}
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-referral">Referral Code (Optional)</Label>
                        <Input
                          id="signup-referral"
                          type="text"
                          placeholder="Enter referral code"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          maxLength={8}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full gradient-gold text-primary font-semibold shadow-gold"
                        disabled={loading}
                      >
                        {loading ? "Signing up..." : "Sign Up"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
          {/* ------------------------------------------------------------------ */}
        </div>
      </div>
    </div>
  );
};

export default Auth;