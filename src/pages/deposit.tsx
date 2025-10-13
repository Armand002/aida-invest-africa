import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function Deposit() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(100);
  const [currency, setCurrency] = useState("USDT");
  const [network, setNetwork] = useState("TRC20"); 
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setError("");
    setSuccess("");

    if (!user || !session) {
      setError("Vous devez être connecté.");
      return;
    }

    if (amount <= 0) {
      setError("Le montant doit être supérieur à 0.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount,
            currency,
            network,
            user_id: user.id,
            user_email: user.email,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erreur serveur (${response.status}) : ${text}`);
      }

      const data = await response.json();
      console.log("Réponse create-payment:", data);

      if (data.checkout_url) {
        setSuccess("Redirection vers le paiement en cours...");
        window.location.href = data.checkout_url;
      } else {
        throw new Error("URL de paiement introuvable.");
      }
    } catch (err) {
      console.error("Erreur createPayment:", err);
      setError(err.message || "Une erreur est survenue lors de la création du paiement.");
    } finally {
      setLoading(false);
    }
  }, [user, session, amount, currency, network]);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ajouter des fonds</h1>

      {/* Montant */}
      <label className="block mb-2">Montant en USD</label>
      <input
        type="number"
        value={amount}
        min="1"
        step="0.01"
        onChange={(e) => setAmount(Number(e.target.value))}
        className="border rounded p-2 mb-4 w-full"
      />

      {/* Cryptomonnaie */}
      <label className="block mb-2">Cryptomonnaie</label>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="border rounded p-2 mb-4 w-full"
      >
        <option value="USDT">Tether (USDT)</option>
        <option value="BTC">Bitcoin (BTC)</option>
        <option value="ETH">Ethereum (ETH)</option>
      </select>

      {/* Réseaux pour USDT */}
      {currency === "USDT" && (
        <>
          <label className="block mb-2">Réseau</label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="border rounded p-2 mb-4 w-full"
          >
            <option value="TRC20">TRC20 (Tron)</option>
            <option value="ERC20">ERC20 (Ethereum)</option>
            <option value="BEP20">BEP20 (Binance Smart Chain)</option>
            <option value="SOL">SOL (Solana)</option>
          </select>
        </>
      )}

      {/* Messages */}
      {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}
      {success && <p className="text-green-600 mb-2 text-sm">{success}</p>}

      {/* Boutons */}
      <div className="flex gap-3">
        <button
          onClick={createPayment}
          disabled={loading || !session || !user}
          className={`flex-1 px-4 py-2 rounded text-white transition ${loading ? "bg-gray-400" : "bg-primary hover:bg-primary/90"}`}
        >
          {loading ? "Création du paiement..." : "Payer maintenant"}
        </button>

        <button
          onClick={() => navigate("/dashboard")}
          className="flex-1 px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition"
        >
          Dashboard
        </button>

        <button
          onClick={() => navigate("/packs")}
          className="flex-1 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
        >
          Packs
        </button>
      </div>
    </div>
  );
}
