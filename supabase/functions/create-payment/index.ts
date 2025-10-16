import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { amount, currency, network, user_id, user_email } = await req.json();

    console.log('Creating payment:', { amount, currency, network, user_id, user_email });

    const publicKey = Deno.env.get('COINPAYMENTS_PUBLIC_KEY');
    const privateKey = Deno.env.get('COINPAYMENTS_PRIVATE_KEY');

    if (!publicKey || !privateKey) {
      throw new Error('CoinPayments API keys not configured');
    }

    // Prepare IPN URL (callback URL for CoinPayments)
    const ipnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/coinpayments-ipn`;

    // Create transaction with CoinPayments API
    const params = {
      version: '1',
      cmd: 'create_transaction',
      key: publicKey,
      amount: amount.toString(),
      currency1: 'USD',
      currency2: currency,
      buyer_email: user_email,
      ipn_url: ipnUrl,
      custom: user_id, // Store user_id for callback
      ...(currency === 'USDT' && network ? { network } : {}),
    };

    // Create HMAC signature
    const encoder = new TextEncoder();
    const paramsString = new URLSearchParams(params).toString();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(privateKey),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(paramsString));
    const hmac = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Call CoinPayments API
    const response = await fetch('https://www.coinpayments.net/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'HMAC': hmac,
      },
      body: paramsString,
    });

    const data = await response.json();
    console.log('CoinPayments response:', data);

    if (data.error !== 'ok') {
      throw new Error(data.error || 'CoinPayments API error');
    }

    // Store payment in database
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id,
        amount,
        currency,
        status: 'pending',
        txid: data.result.txn_id,
        checkout_url: data.result.checkout_url,
        amount_original: data.result.amount,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({
        checkout_url: data.result.checkout_url,
        txn_id: data.result.txn_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
