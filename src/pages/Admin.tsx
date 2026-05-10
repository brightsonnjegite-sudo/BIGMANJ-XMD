import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { Shield, Tv, Grid3x3, Radio, Trophy, Image, Users, Bell, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const adminSections = [
  { icon: Tv, title: "Channels", description: "Manage channels", path: "/admin/channels", color: "text-primary" },
  { icon: Grid3x3, title: "Categories", description: "Manage categories", path: "/admin/categories", color: "text-primary" },
  { icon: Radio, title: "Radio", description: "Radio stations", path: "/admin/radio", color: "text-primary" },
  { icon: Trophy, title: "Matches", description: "Today's matches", path: "/admin/matches", color: "text-primary" },
  { icon: Image, title: "Sliders", description: "Banner sliders", path: "/admin/sliders", color: "text-primary" },
  { icon: Users, title: "Users", description: "User management", path: "/admin/users", color: "text-primary" },
  { icon: Bell, title: "Notifications", description: "Send notifications", path: "/admin/notifications", color: "text-primary" },
  { icon: Settings, title: "Global Config", description: "Token & settings", path: "/admin/config", color: "text-primary" },
];

const Admin = () => {
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-xl">Admin Panel</h1>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {adminSections.map((section) => (
            <Link key={section.path} to={section.path}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-card rounded-lg p-4 flex flex-col gap-2 border border-border hover:border-primary/30 transition-colors"
              >
                <section.icon className={`w-6 h-6 ${section.color}`} />
                <div>
                  <p className="font-display font-bold text-sm">{section.title}</p>
                  <p className="text-[10px] text-muted-foreground">{section.description}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Admin;
