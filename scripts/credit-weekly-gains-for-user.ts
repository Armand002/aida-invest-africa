import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
const env = config();
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export async function creditWeeklyGainsForUser(userId: string) {
  try {
    // 1️⃣ Récupérer tous les investissements actifs
    const { data: investments, error: invErr } = await supabase
      .from("user_investments")
      .select(`id, investment_amount, weekly_return, total_earned, current_week, status, investment_packs(duration_weeks)`)
      .eq("user_id", userId)
      .eq("status", "active");

    if (invErr) throw invErr;

    if (!investments || investments.length === 0) {
      console.log("Aucun investissement actif pour cet utilisateur.");
      return;
    }

    for (const inv of investments) {
      try {
        const currentWeek = Number(inv.current_week || 0);
        const nextWeek = currentWeek + 1;
        const durationWeeks = Number(inv.investment_packs?.duration_weeks || 0);
        const isLastWeek = nextWeek >= durationWeeks;

        const weeklyReturn = Number(inv.weekly_return || 0);
        const investmentAmount = Number(inv.investment_amount || 0);

        // 2️⃣ Mettre à jour l'investissement
        const { error: updateInvErr } = await supabase
          .from("user_investments")
          .update({
            total_earned: Number(inv.total_earned || 0) + weeklyReturn,
            current_week: nextWeek,
            status: isLastWeek ? "completed" : "active",
          })
          .eq("id", inv.id);

        if (updateInvErr) throw updateInvErr;

        // 3️⃣ Mettre à jour le profil de l'utilisateur
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("wallet_balance, released_capital")
          .eq("id", userId)
          .single();

        if (profileErr) throw profileErr;

        let newWalletBalance = Number(profile?.wallet_balance || 0) + weeklyReturn;
        let newReleasedCapital = Number(profile?.released_capital || 0);

        if (isLastWeek) {
          newWalletBalance += investmentAmount;
          newReleasedCapital += investmentAmount;
        }

        const { error: updateProfileErr } = await supabase
          .from("profiles")
          .update({
            wallet_balance: newWalletBalance,
            released_capital: newReleasedCapital,
          })
          .eq("id", userId);

        if (updateProfileErr) throw updateProfileErr;

        // 4️⃣ Créer la transaction wallet
        const { error: txErr } = await supabase.from("wallet_transactions").insert({
          user_id: userId,
          type: "return",
          amount: weeklyReturn,
          status: "completed",
          notes: `Weekly gain for investment ${inv.id}`,
        });

        if (txErr) throw txErr;

        console.log(`✅ Credited $${weeklyReturn} for user ${userId}, week ${nextWeek}`);
      } catch (err) {
        console.error(`❌ Error processing investment ${inv.id}:`, err);
      }
    }

    console.log("✅ All weekly gains processed!");
  } catch (err) {
    console.error("❌ Error crediting weekly gains:", err);
  }
}

// Test local
if (import.meta.main) {
  const userId = Deno.args[0];
  if (!userId) {
    console.error("Please provide the user UUID!");
    Deno.exit(1);
  }
  await creditWeeklyGainsForUser(userId);
}
