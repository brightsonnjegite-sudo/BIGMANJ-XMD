import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TrialStatus {
  trialActive: boolean;
  timeLeft: number;
  hasSubscription: boolean;
  hasTrial: boolean;
  loading: boolean;
}

export function useServerTrial(userId: string | undefined, isPro: boolean) {
  const [status, setStatus] = useState<TrialStatus>({
    trialActive: false,
    timeLeft: 0,
    hasSubscription: false,
    hasTrial: false,
    loading: true,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const checkTrial = useCallback(async (action?: "start" | "check") => {
    if (!userId || !isPro) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/check-trial-status?action=${action || "check"}`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) return;
      const data = await res.json();

      if (mountedRef.current) {
        setStatus({
          trialActive: data.trial_active ?? false,
          timeLeft: data.time_left ?? 0,
          hasSubscription: data.has_subscription ?? false,
          hasTrial: data.has_trial !== false,
          loading: false,
        });
      }
    } catch {
      if (mountedRef.current) {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    }
  }, [userId, isPro]);

  const startTrial = useCallback(() => checkTrial("start"), [checkTrial]);

  // Initial check
  useEffect(() => {
    mountedRef.current = true;
    if (userId && isPro) {
      checkTrial("check");
    } else {
      setStatus((s) => ({ ...s, loading: false }));
    }
    return () => {
      mountedRef.current = false;
    };
  }, [userId, isPro, checkTrial]);

  // Countdown timer - polls server every 5s during active trial
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (status.trialActive && status.timeLeft > 0 && !status.hasSubscription) {
      intervalRef.current = setInterval(() => {
        setStatus((prev) => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            // Re-check server to confirm expiry
            checkTrial("check");
            return { ...prev, timeLeft: 0, trialActive: false };
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);

      // Also poll server periodically to stay synced
      const serverPoll = setInterval(() => checkTrial("check"), 5000);
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        clearInterval(serverPoll);
      };
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status.trialActive, status.hasSubscription, checkTrial]);

  return { ...status, startTrial, refreshTrial: () => checkTrial("check") };
}
