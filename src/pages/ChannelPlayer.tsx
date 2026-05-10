import { AppLayout } from "@/components/AppLayout";
import { ChannelCard } from "@/components/ChannelCard";
import { CategoryRow } from "@/components/CategoryRow";
import { VideoPlayer } from "@/components/VideoPlayer";
import { FreeTrialOverlay } from "@/components/FreeTrialOverlay";
import { ChannelCardSkeleton } from "@/components/Skeletons";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { t } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { useServerTrial } from "@/hooks/useServerTrial";

const ChannelPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, subscription, profile } = useAuth();
  const [stopped, setStopped] = useState(false);
  const videoActiveRef = useRef(true);

  // Fetch current channel
  const { data: channel, isLoading } = useQuery({
    queryKey: ["channel", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("channels")
        .select("*, categories(name)")
        .eq("id", id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  // Fetch suggested channels
  const { data: suggested } = useQuery({
    queryKey: ["suggested", channel?.category_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("channels")
        .select("*, categories(name)")
        .eq("is_active", true)
        .neq("id", id!)
        .limit(10);
      return data || [];
    },
    enabled: !!channel,
  });

  const isPro = channel?.is_pro ?? false;
  const isBlocked = (profile as any)?.status === "blocked";
  const hasActiveSubscription = !!subscription;

  // Server-side trial management
  const {
    trialActive,
    timeLeft,
    hasSubscription: trialHasSub,
    hasTrial,
    loading: trialLoading,
    startTrial,
  } = useServerTrial(user?.id, isPro);

  // Determine access: premium user, or free channel, or active trial
  const canPlay = !isPro || hasActiveSubscription || trialHasSub || trialActive;
  const showTrialExpired = isPro && !hasActiveSubscription && !trialHasSub && hasTrial && !trialActive && !trialLoading;
  const showTrialTimer = isPro && !hasActiveSubscription && !trialHasSub && trialActive;
  const needsTrialStart = isPro && !hasActiveSubscription && !trialHasSub && !hasTrial && !trialLoading;

  // Auto-start trial when user first plays a PRO channel
  const [trialStarted, setTrialStarted] = useState(false);
  useEffect(() => {
    if (needsTrialStart && !trialStarted && user) {
      setTrialStarted(true);
      startTrial();
    }
  }, [needsTrialStart, trialStarted, user, startTrial]);

  // Stop video when trial expires
  useEffect(() => {
    if (showTrialExpired) {
      setStopped(true);
    }
  }, [showTrialExpired]);

  // Reset on channel change
  useEffect(() => {
    videoActiveRef.current = true;
    setStopped(false);
    setTrialStarted(false);
    return () => {
      videoActiveRef.current = false;
      setStopped(true);
    };
  }, [id]);

  const handleBack = useCallback(() => {
    setStopped(true);
    videoActiveRef.current = false;
    navigate(-1);
  }, [navigate]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      setStopped(true);
      videoActiveRef.current = false;
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (isLoading || trialLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!channel) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Channel not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Back button */}
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-card hover:bg-accent/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <span className="text-xs text-muted-foreground truncate">{channel.name}</span>
        </div>

        {/* Player Area */}
        <div className="relative">
          {isBlocked ? (
            <div className="w-full aspect-video bg-black flex items-center justify-center">
              <p className="text-sm text-destructive font-semibold">
                Your account has been blocked. Contact support.
              </p>
            </div>
          ) : showTrialExpired ? (
            <div className="w-full aspect-video bg-black relative">
              <FreeTrialOverlay remainingSeconds={0} trialExpired={true} />
            </div>
          ) : (
            <>
              <VideoPlayer
                streamUrl={channel.stream_url}
                streamType={channel.stream_type}
                keyId={channel.key_id}
                drmKey={channel.key}
                token={channel.token}
                forceStop={stopped || showTrialExpired}
              />
              {showTrialTimer && (
                <FreeTrialOverlay
                  remainingSeconds={timeLeft}
                  trialExpired={false}
                />
              )}
            </>
          )}
        </div>

        {/* Channel Info */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold">{channel.name}</h1>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                isPro
                  ? "bg-gold text-gold-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isPro ? "PRO" : "FREE"}
            </span>
          </div>
          {channel.channel_number && (
            <p className="text-xs text-muted-foreground mt-0.5">
              CH {channel.channel_number} • {(channel as any).categories?.name || ""}
            </p>
          )}
        </div>

        {/* Suggested Channels */}
        <div className="mt-4">
          <CategoryRow title={t("suggestedChannels")}>
            {suggested ? (
              suggested.map((ch) => (
                <ChannelCard
                  key={ch.id}
                  id={ch.id}
                  name={ch.name}
                  image={ch.image_url || "https://images.unsplash.com/photo-1461896836934-bd45ba48b2b5?w=300&q=80"}
                  category={(ch as any).categories?.name || ""}
                  isPro={ch.is_pro}
                  channelNumber={ch.channel_number || undefined}
                />
              ))
            ) : (
              [1, 2, 3, 4].map((i) => <ChannelCardSkeleton key={i} />)
            )}
          </CategoryRow>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default ChannelPlayer;
