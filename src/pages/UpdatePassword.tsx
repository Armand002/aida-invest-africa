import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import Navbar from "@/components/Navbar";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Supabase gère l'échange de jetons via l'URL pour établir une session temporaire.
    // Nous vérifions si une session temporaire (via le lien de reset) est active.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsReady(true);
      } else {
        // Rediriger si l'utilisateur arrive ici sans session valide (lien invalide/expiré)
        toast({
            title: "Error",
            description: "Invalid or expired reset link. Please try again.",
            variant: "destructive"
        });
        navigate("/auth");
      }
    });
  }, [navigate, toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password.length < 6) {
        toast({
            title: "Validation Error",
            description: "Password must be at least 6 characters long.",
            variant: "destructive"
        });
        setLoading(false);
        return;
    }

    // Mise à jour du mot de passe de l'utilisateur.
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "Update Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Your password has been updated successfully. Redirecting to dashboard...",
      });
      // Redirection après succès
      navigate("/dashboard");
    }

    setLoading(false);
  };

  if (!isReady) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <p className="text-xl text-muted-foreground">Loading reset session...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
            <p className="text-muted-foreground">
              Enter and confirm your new password to regain access.
            </p>
          </div>
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Update Password</CardTitle>
              <CardDescription>
                Ensure your new password is secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
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
                <Button
                  type="submit"
                  className="w-full gradient-gold text-primary font-semibold shadow-gold"
                  disabled={loading || !password}
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;