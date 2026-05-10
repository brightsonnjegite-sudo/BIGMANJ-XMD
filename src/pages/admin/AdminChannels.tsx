import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, Tv } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const AdminChannels = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", channel_number: 0, category_id: "", image_url: "", icon_url: "",
    stream_url: "", stream_type: "hls" as const, key_id: "", key: "", is_pro: false,
  });

  const { data: channels, isLoading } = useQuery({
    queryKey: ["admin-channels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("channels").select("*, categories(name)").order("channel_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("display_order");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        channel_number: form.channel_number || null,
        category_id: form.category_id || null,
        image_url: form.image_url || null,
        icon_url: form.icon_url || null,
        stream_url: form.stream_url,
        stream_type: form.stream_type,
        key_id: form.key_id || null,
        key: form.key || null,
        is_pro: form.is_pro,
      };
      if (editId) {
        const { error } = await supabase.from("channels").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("channels").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Channel updated" : "Channel added");
      queryClient.invalidateQueries({ queryKey: ["admin-channels"] });
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("channels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Channel deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-channels"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", channel_number: 0, category_id: "", image_url: "", icon_url: "", stream_url: "", stream_type: "hls", key_id: "", key: "", is_pro: false });
  };

  const startEdit = (ch: any) => {
    setEditId(ch.id);
    setForm({
      name: ch.name, channel_number: ch.channel_number || 0, category_id: ch.category_id || "",
      image_url: ch.image_url || "", icon_url: ch.icon_url || "", stream_url: ch.stream_url,
      stream_type: ch.stream_type, key_id: ch.key_id || "", key: ch.key || "", is_pro: ch.is_pro,
    });
    setShowForm(true);
  };

  const update = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/admin" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"><ArrowLeft className="w-4 h-4" /></Link>
          <Tv className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-xl flex-1">Channels</h1>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg p-4 mb-4 border border-border space-y-3">
            <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Channel Name" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={form.channel_number} onChange={(e) => update("channel_number", parseInt(e.target.value) || 0)} placeholder="Channel #" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
              <select value={form.category_id} onChange={(e) => update("category_id", e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="">Category</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <input value={form.stream_url} onChange={(e) => update("stream_url", e.target.value)} placeholder="Stream URL" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.stream_type} onChange={(e) => update("stream_type", e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="hls">HLS</option>
                <option value="m3u8">M3U8</option>
                <option value="ts">TS</option>
                <option value="mpd">MPD (DASH)</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_pro} onChange={(e) => update("is_pro", e.target.checked)} className="accent-primary" /> PRO Channel
              </label>
            </div>
            {(form.stream_type as string) === "mpd" && (
              <div className="space-y-2">
                <input value={form.key_id} onChange={(e) => update("key_id", e.target.value)} placeholder="Key ID" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                <input value={form.key} onChange={(e) => update("key", e.target.value)} placeholder="DRM Key" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            )}
            <input value={form.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder="Image URL" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="flex gap-2">
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Add Channel"}
              </button>
              <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent">Cancel</button>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton-loading h-16 rounded-lg" />)}</div>
        ) : (
          <div className="space-y-2">
            {channels?.map((ch) => (
              <div key={ch.id} className="bg-card rounded-lg p-3 flex items-center gap-3 border border-border">
                {ch.image_url && <img src={ch.image_url} alt={ch.name} className="w-12 h-8 rounded object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ch.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    CH {ch.channel_number} • {(ch as any).categories?.name || "No category"} • {ch.stream_type.toUpperCase()}
                  </p>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ch.is_pro ? "bg-gold text-gold-foreground" : "bg-primary text-primary-foreground"}`}>
                  {ch.is_pro ? "PRO" : "FREE"}
                </span>
                <button onClick={() => startEdit(ch)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteMutation.mutate(ch.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/20 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {channels?.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No channels yet</p>}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default AdminChannels;
