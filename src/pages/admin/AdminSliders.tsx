import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const AdminSliders = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ image_url: "", title: "", description: "", display_order: 0 });

  const { data: sliders, isLoading } = useQuery({
    queryKey: ["admin-sliders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sliders").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { image_url: form.image_url, title: form.title || null, description: form.description || null, display_order: form.display_order };
      if (editId) { const { error } = await supabase.from("sliders").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("sliders").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { toast.success("Saved"); queryClient.invalidateQueries({ queryKey: ["admin-sliders"] }); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("sliders").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["admin-sliders"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ image_url: "", title: "", description: "", display_order: 0 }); };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/admin" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"><ArrowLeft className="w-4 h-4" /></Link>
          <Image className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-xl flex-1">Sliders</h1>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
        </div>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg p-4 mb-4 border border-border space-y-3">
            <input value={form.image_url} onChange={(e) => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="Image URL *" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <input type="number" value={form.display_order} onChange={(e) => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} placeholder="Order" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            <div className="flex gap-2">
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold disabled:opacity-50">{editId ? "Update" : "Add Slider"}</button>
              <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent">Cancel</button>
            </div>
          </motion.div>
        )}
        {isLoading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton-loading h-14 rounded-lg" />)}</div> : (
          <div className="space-y-2">
            {sliders?.map((s) => (
              <div key={s.id} className="bg-card rounded-lg p-3 flex items-center gap-3 border border-border">
                {s.image_url && <img src={s.image_url} alt={s.title || ""} className="w-16 h-10 rounded object-cover" />}
                <div className="flex-1"><p className="text-sm font-medium">{s.title || "Untitled"}</p><p className="text-[10px] text-muted-foreground">Order: {s.display_order}</p></div>
                <button onClick={() => { setEditId(s.id); setForm({ image_url: s.image_url, title: s.title || "", description: s.description || "", display_order: s.display_order }); setShowForm(true); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteMutation.mutate(s.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive/20 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {sliders?.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No sliders yet</p>}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default AdminSliders;
