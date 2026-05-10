import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const AdminNotifications = () => {
  const [form, setForm] = useState({ title: "", message: "" });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").insert({
        title: form.title,
        message: form.message,
        is_global: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notification sent to all users!");
      setForm({ title: "", message: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/admin" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"><ArrowLeft className="w-4 h-4" /></Link>
          <Bell className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-xl">Send Notification</h1>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Notification Title"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={form.message}
            onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
            placeholder="Notification Message"
            rows={4}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
          <button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !form.title.trim() || !form.message.trim()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sendMutation.isPending ? "Sending..." : "Send to All Users"}
          </button>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default AdminNotifications;
