import { AppLayout } from "@/components/AppLayout";
import { HeroBanner } from "@/components/HeroBanner";
import { CategoryRow } from "@/components/CategoryRow";
import { ChannelCard } from "@/components/ChannelCard";
import { ChannelCardSkeleton } from "@/components/Skeletons";
import { t } from "@/lib/i18n";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("display_order");
      return data || [];
    },
  });

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data } = await supabase.from("channels").select("*, categories(name, icon)").order("channel_number");
      return data || [];
    },
  });

  const { data: matches } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data } = await supabase.from("matches").select("*, channels(name)").order("display_order");
      return data || [];
    },
  });

  const channelsByCategory = categories?.map((cat) => ({
    ...cat,
    channels: channels?.filter((ch) => ch.category_id === cat.id) || [],
  })) || [];

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <div className="px-4 pt-3 mb-6">
          <HeroBanner />
        </div>

        {/* Today Matches */}
        {matches && matches.length > 0 && (
          <CategoryRow title={t("todayMatches")}>
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex-shrink-0 w-64 group cursor-pointer"
                onClick={() => match.channel_id && navigate(`/channel/${match.channel_id}`)}
              >
                <motion.div whileHover={{ scale: 1.03 }} className="relative aspect-[16/9] rounded-lg overflow-hidden bg-card">
                  {match.image_url ? (
                    <img src={match.image_url} alt={match.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-accent/20 flex items-center justify-center">
                      <span className="text-2xl">⚽</span>
                    </div>
                  )}
                  <div className="gradient-card absolute inset-0" />
                  {match.is_live && (
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground live-pulse">LIVE</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs font-medium">{match.title}</p>
                    {(match as any).channels?.name && (
                      <p className="text-[9px] text-muted-foreground mt-0.5">📺 {(match as any).channels.name}</p>
                    )}
                  </div>
                </motion.div>
              </div>
            ))}
          </CategoryRow>
        )}

        {/* Channels by Category */}
        {channelsLoading ? (
          <CategoryRow title="Loading...">
            {[1,2,3,4].map(i => <ChannelCardSkeleton key={i} />)}
          </CategoryRow>
        ) : (
          channelsByCategory.filter(c => c.channels.length > 0).map((cat) => (
            <CategoryRow key={cat.id} title={`${cat.icon || ""} ${cat.name}`} onSeeAll={() => navigate(`/category/${cat.id}`)}>
              {cat.channels.map((ch) => (
                <ChannelCard
                  key={ch.id}
                  id={ch.id}
                  name={ch.name}
                  image={ch.image_url || "https://images.unsplash.com/photo-1461896836934-bd45ba48b2b5?w=300&q=80"}
                  category={(ch as any).categories?.name || ""}
                  isPro={ch.is_pro}
                  channelNumber={ch.channel_number || undefined}
                />
              ))}
            </CategoryRow>
          ))
        )}

        {/* Show message if no channels */}
        {!channelsLoading && channels?.length === 0 && (
          <div className="text-center py-12 px-4">
            <p className="text-muted-foreground text-sm">No channels yet. Add channels from the Admin panel.</p>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default Index;
