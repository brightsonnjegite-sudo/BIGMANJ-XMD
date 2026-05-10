import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const AdminRadio = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", logo_url: "", stream_url: "" });

  const { data: stations, isLoading } = useQuery({
    queryKey: ["admin-radio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("radio_stations").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, logo_url: form.logo_url || null, stream_url: form.stream_url };
      if (editId) { const { error } = await supabase.from("radio_stations").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("radio_stations").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { toast.success("Saved"); queryClient.invalidateQueries({ queryKey: ["admin-radio"] }); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("radio_stations").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["admin-radio"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ name: "", logo_url: "", stream_url: "" }); };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/admin" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"><ArrowLeft className="w-4 h-4" /></Link>
          <Radio className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-xl flex-1">Radio Stations</h1>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
        </div>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg p-4 mb-4 border border-border space-y-3">
            <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Station Name" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={form.stream_url} onChange={(e) => setForm(p => ({ ...p, stream_url: e.target.value }))} placeholder="Stream URL" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={form.logo_url} onChange={(e) => setForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="Logo URL" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="flex gap-2">
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold disabled:opacity-50">{editId ? "Update" : "Add Station"}</button>
              <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent">Cancel</button>
            </div>
          </motion.div>
        )}
        {isLoading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton-loading h-14 rounded-lg" />)}</div> : (
          <div className="space-y-2">
            {stations?.map((s) => (
              <div key={s.id} className="bg-card rounded-lg p-3 flex items-center gap-3 border border-border">
                {s.logo_url && <img src={s.logo_url} alt={s.name} className="w-10 h-10 rounded-full object-cover" />}
                <div className="flex-1"><p className="text-sm font-medium">{s.name}</p></div>
                <button onClick={() => { setEditId(s.id); setForm({ name: s.name, logo_url: s.logo_url || "", stream_url: s.stream_url }); setShowForm(true); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteMutation.mutate(s.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/20 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {stations?.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No radio stations yet</p>}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default AdminRadio;
