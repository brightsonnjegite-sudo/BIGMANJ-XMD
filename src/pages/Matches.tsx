import { AppLayout } from "@/components/AppLayout";
import { t } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Trophy, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const Matches = () => {
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("*, channels(name)")
        .order("display_order");
      return data || [];
    },
  });

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-xl">{t("todayMatches")}</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-loading h-32 rounded-lg" />
            ))}
          </div>
        ) : matches && matches.length > 0 ? (
          <div className="grid gap-3">
            {matches.map((match) => (
              <Link key={match.id} to={match.channel_id ? `/channel/${match.channel_id}` : "#"}>
                <motion.div whileHover={{ scale: 1.01 }} className="relative rounded-lg overflow-hidden bg-card aspect-[21/9]">
                  {match.image_url ? (
                    <img src={match.image_url} alt={match.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-accent/20 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="gradient-card absolute inset-0" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {match.is_live ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-primary-foreground live-pulse">LIVE</span>
                    ) : match.match_time ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-accent text-accent-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(match.match_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : null}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-display font-bold text-sm">{match.title}</p>
                    {(match as any).channels?.name && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">📺 {(match as any).channels.name}</p>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-12">No matches scheduled</p>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default Matches;
