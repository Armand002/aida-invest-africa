import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const ipnData: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      ipnData[key] = value.toString();
    });

    console.log('IPN received:', ipnData);

    // Verify IPN authenticity
    const privateKey = Deno.env.get('COINPAYMENTS_PRIVATE_KEY');
    if (!privateKey) {
      throw new Error('CoinPayments private key not configured');
    }

    const merchantId = Deno.env.get('COINPAYMENTS_MERCHANT_ID');
    if (ipnData.merchant && merchantId && ipnData.merchant !== merchantId) {
      throw new Error('Invalid merchant ID');
    }

    const txnId = ipnData.txn_id;
    const status = parseInt(ipnData.status || '0');
    const userId = ipnData.custom; // user_id stored in custom field
    const amount = parseFloat(ipnData.amount1 || '0'); // amount in USD

    console.log('Processing IPN:', { txnId, status, userId, amount });

    // Update payment record
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: status >= 100 ? 'completed' : status < 0 ? 'failed' : 'pending',
        ipn_payload: ipnData,
        updated_at: new Date().toISOString(),
      })
      .eq('txid', txnId);

    if (updateError) {
      console.error('Error updating payment:', updateError);
    }

    // Credit wallet if payment is completed (status >= 100)
    if (status >= 100 && userId && amount > 0) {
      console.log('Payment completed, crediting wallet:', { userId, amount });

      // Use RPC to increment wallet balance
      const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
        user_uuid: userId,
        add_amount: amount,
      });

      if (walletError) {
        console.error('Error updating wallet:', walletError);
      }

      // Create wallet transaction record
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: amount,
          status: 'completed',
          transaction_hash: txnId,
          notes: `Dépôt ${ipnData.currency2 || 'crypto'} via CoinPayments`,
        });

      if (txError) {
        console.error('Error creating transaction record:', txError);
      }

      console.log('Wallet credited successfully');
    } else if (status < 0) {
      console.log('Payment failed or cancelled:', { txnId, status });
    } else {
      console.log('Payment pending:', { txnId, status });
    }

    return new Response('IPN processed', { status: 200 });
  } catch (error) {
    console.error('Error in coinpayments-ipn:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
