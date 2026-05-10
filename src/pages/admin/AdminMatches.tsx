import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Plus, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const AdminMatches = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", image_url: "", display_order: 0, is_live: false, match_time: "", channel_id: "" });

  const { data: matches, isLoading } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("matches").select("*, channels(name)").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: channels } = useQuery({
    queryKey: ["admin-channels-list"],
    queryFn: async () => {
      const { data } = await supabase.from("channels").select("id, name").order("name");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        image_url: form.image_url || null,
        display_order: form.display_order,
        is_live: form.is_live,
        match_time: form.match_time || null,
        channel_id: form.channel_id || null,
      };
      if (editId) {
        const { error } = await supabase.from("matches").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("matches").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Match saved"); queryClient.invalidateQueries({ queryKey: ["admin-matches"] }); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["admin-matches"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ title: "", image_url: "", display_order: 0, is_live: false, match_time: "", channel_id: "" }); };

  const startEdit = (m: any) => {
    setEditId(m.id);
    setForm({ title: m.title, image_url: m.image_url || "", display_order: m.display_order, is_live: m.is_live, match_time: m.match_time || "", channel_id: m.channel_id || "" });
    setShowForm(true);
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link to="/admin" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"><ArrowLeft className="w-4 h-4" /></Link>
            <Trophy className="w-5 h-5 text-primary" />
            <h1 className="font-display font-bold text-xl">Matches</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        {showForm && (
          <div className="bg-card rounded-lg p-4 border border-border mb-4 space-y-3">
            <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Match Title (e.g. Team A vs Team B)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={form.image_url} onChange={(e) => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="Image URL" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input type="datetime-local" value={form.match_time ? form.match_time.slice(0, 16) : ""} onChange={(e) => setForm(p => ({ ...p, match_time: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <select value={form.channel_id} onChange={(e) => setForm(p => ({ ...p, channel_id: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">No linked channel</option>
              {channels?.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select>
            <div className="flex items-center gap-4">
              <input type="number" value={form.display_order} onChange={(e) => setForm(p => ({ ...p, display_order: +e.target.value }))} placeholder="Order" className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_live} onChange={(e) => setForm(p => ({ ...p, is_live: e.target.checked }))} className="accent-primary" /> LIVE
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title.trim()} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Save"}
              </button>
              <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent">Cancel</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="skeleton-loading h-16 rounded-lg" />)}</div>
        ) : (
          <div className="space-y-2">
            {matches?.map((m) => (
              <div key={m.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-3">
                {m.image_url && <img src={m.image_url} className="w-16 h-10 rounded object-cover" alt="" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {m.is_live && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">LIVE</span>}
                    {(m as any).channels?.name && <span className="text-[9px] text-muted-foreground">📺 {(m as any).channels.name}</span>}
                    {m.match_time && <span className="text-[9px] text-muted-foreground">{new Date(m.match_time).toLocaleString()}</span>}
                  </div>
                </div>
                <button onClick={() => startEdit(m)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteMutation.mutate(m.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/20 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {matches?.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No matches</p>}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default AdminMatches;
