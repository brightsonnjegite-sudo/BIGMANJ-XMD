import { AppLayout } from "@/components/AppLayout";
import { ChannelCard } from "@/components/ChannelCard";
import { ChannelCardSkeleton } from "@/components/Skeletons";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const CategoryChannels = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: category } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: channels, isLoading } = useQuery({
    queryKey: ["category-channels", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("channels")
        .select("*, categories(name)")
        .eq("category_id", id!)
        .eq("is_active", true)
        .order("channel_number");
      return data || [];
    },
    enabled: !!id,
  });

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-card hover:bg-accent/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-base font-bold">
            {category?.icon || ""} {category?.name || "Category"}
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ChannelCardSkeleton key={i} />)
            : channels?.map((ch) => (
                <ChannelCard
                  key={ch.id}
                  id={ch.id}
                  name={ch.name}
                  image={ch.image_url || "https://images.unsplash.com/photo-1461896836934-bd45ba48b2b5?w=300&q=80"}
                  category={(ch as any).categories?.name || ""}
                  isPro={ch.is_pro}
                  channelNumber={ch.channel_number || undefined}
                  gridMode
                />
              ))}
        </div>

        {!isLoading && channels?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Hakuna channel kwenye category hii</p>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default CategoryChannels;
