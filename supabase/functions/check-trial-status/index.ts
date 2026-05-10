import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TRIAL_DURATION_SECONDS = 30; // 30 seconds trial

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "check";

    // Check if user has active subscription - if so, skip trial logic
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (sub) {
      return new Response(
        JSON.stringify({ trial_active: true, time_left: 9999, has_subscription: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check existing trial
    const { data: trial } = await supabaseAdmin
      .from("user_trials")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (action === "start" && !trial) {
      // Start a new trial
      const expiresAt = new Date(Date.now() + TRIAL_DURATION_SECONDS * 1000).toISOString();
      const { error: insertErr } = await supabaseAdmin
        .from("user_trials")
        .insert({ user_id: userId, expires_at: expiresAt, status: "active" });

      if (insertErr) {
        // Race condition: trial may have been created by another request
        const { data: existingTrial } = await supabaseAdmin
          .from("user_trials")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingTrial) {
          const timeLeft = Math.max(0, Math.floor((new Date(existingTrial.expires_at).getTime() - Date.now()) / 1000));
          const isActive = existingTrial.status === "active" && timeLeft > 0;
          return new Response(
            JSON.stringify({ trial_active: isActive, time_left: isActive ? timeLeft : 0, has_subscription: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: "Failed to start trial" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Also mark free_trial_used on profiles
      await supabaseAdmin
        .from("profiles")
        .update({ free_trial_used: true })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ trial_active: true, time_left: TRIAL_DURATION_SECONDS, has_subscription: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!trial) {
      // No trial started yet
      return new Response(
        JSON.stringify({ trial_active: false, time_left: 0, has_trial: false, has_subscription: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trial exists - check if expired
    const timeLeft = Math.max(0, Math.floor((new Date(trial.expires_at).getTime() - Date.now()) / 1000));
    
    if (trial.status === "active" && timeLeft <= 0) {
      // Expire the trial server-side
      await supabaseAdmin
        .from("user_trials")
        .update({ status: "expired" })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ trial_active: false, time_left: 0, has_subscription: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isActive = trial.status === "active" && timeLeft > 0;
    return new Response(
      JSON.stringify({ trial_active: isActive, time_left: isActive ? timeLeft : 0, has_subscription: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
