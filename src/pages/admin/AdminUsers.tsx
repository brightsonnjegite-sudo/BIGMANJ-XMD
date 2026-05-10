import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { ArrowLeft, Users, UserCheck, UserX, Trash2, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [subModal, setSubModal] = useState<{ userId: string; name: string } | null>(null);
  const [subDuration, setSubDuration] = useState<string>("1_month");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ status: status as any }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("User updated"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const assignSubMutation = useMutation({
    mutationFn: async ({ userId, duration }: { userId: string; duration: string }) => {
      const now = new Date();
      let expires: Date;
      if (duration === "1_week") expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      else if (duration === "2_weeks") expires = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      else expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Deactivate old subs
      await supabase.from("subscriptions").update({ is_active: false }).eq("user_id", userId);
      
      const { error } = await supabase.from("subscriptions").insert({
        user_id: userId,
        duration: duration as any,
        expires_at: expires.toISOString(),
      });
      if (error) throw error;

      // Activate user
      await supabase.from("profiles").update({ status: "active" as any }).eq("user_id", userId);
    },
    onSuccess: () => {
      toast.success("Subscription assigned");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSubModal(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColor: Record<string, string> = {
    active: "text-green-500",
    pending: "text-gold",
    blocked: "text-destructive",
    deleted: "text-muted-foreground",
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/admin" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"><ArrowLeft className="w-4 h-4" /></Link>
          <Users className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-xl">Users</h1>
        </div>

        {/* Subscription Modal */}
        {subModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-background/80 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-card rounded-xl p-6 w-full max-w-sm border border-border">
              <h3 className="font-display font-bold text-lg mb-1">Assign Subscription</h3>
              <p className="text-sm text-muted-foreground mb-4">{subModal.name}</p>
              <select value={subDuration} onChange={(e) => setSubDuration(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-primary">
                <option value="1_week">1 Week</option>
                <option value="2_weeks">2 Weeks</option>
                <option value="1_month">1 Month</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => assignSubMutation.mutate({ userId: subModal.userId, duration: subDuration })} disabled={assignSubMutation.isPending} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                  {assignSubMutation.isPending ? "Assigning..." : "Assign"}
                </button>
                <button onClick={() => setSubModal(null)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton-loading h-16 rounded-lg" />)}</div>
        ) : (
          <div className="space-y-2">
            {profiles?.map((user) => (
              <div key={user.id} className="bg-card rounded-lg p-3 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.first_name} {user.last_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email} • {user.phone}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${statusColor[user.status] || ""}`}>{user.status}</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => updateStatusMutation.mutate({ userId: user.user_id, status: "active" })} className="flex-1 bg-green-500/10 text-green-500 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1">
                    <UserCheck className="w-3 h-3" /> Activate
                  </button>
                  <button onClick={() => updateStatusMutation.mutate({ userId: user.user_id, status: "blocked" })} className="flex-1 bg-destructive/10 text-destructive py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1">
                    <UserX className="w-3 h-3" /> Block
                  </button>
                  <button onClick={() => setSubModal({ userId: user.user_id, name: `${user.first_name} ${user.last_name}` })} className="flex-1 bg-gold/10 text-gold py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1">
                    <Crown className="w-3 h-3" /> Subscribe
                  </button>
                  <button onClick={() => updateStatusMutation.mutate({ userId: user.user_id, status: "deleted" })} className="w-8 flex items-center justify-center rounded hover:bg-destructive/20 text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {profiles?.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No users yet</p>}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default AdminUsers;
