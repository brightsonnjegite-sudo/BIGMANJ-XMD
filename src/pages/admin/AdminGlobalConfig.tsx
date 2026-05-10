import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const AdminGlobalConfig = () => {
  const queryClient = useQueryClient();
  const [globalToken, setGlobalToken] = useState("");

  const { data: config, isLoading } = useQuery({
    queryKey: ["app-config", "global_token"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_config")
        .select("*")
        .eq("key", "global_token")
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) setGlobalToken(config.value);
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("app_config")
        .update({ value: globalToken, updated_at: new Date().toISOString() })
        .eq("key", "global_token");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-config"] });
      toast.success("Global token updated successfully");
    },
    onError: () => toast.error("Failed to update token"),
  });

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Global Config</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 bg-card rounded-xl p-4 border border-border">
            <div>
              <h2 className="text-sm font-semibold mb-1">Global Token</h2>
              <p className="text-xs text-muted-foreground mb-3">
                This token is automatically appended to every channel's MPD/stream URL as <code className="bg-muted px-1 rounded">?token=VALUE</code>. Update it here and it reflects on all channels instantly.
              </p>
              <Input
                value={globalToken}
                onChange={(e) => setGlobalToken(e.target.value)}
                placeholder="Enter global token..."
                className="font-mono text-sm"
              />
            </div>

            {config && (
              <p className="text-[10px] text-muted-foreground">
                Last updated: {new Date(config.updated_at).toLocaleString()}
              </p>
            )}

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Token
            </Button>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default AdminGlobalConfig;
