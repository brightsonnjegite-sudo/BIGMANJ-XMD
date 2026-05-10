import { AppLayout } from "@/components/AppLayout";
import { t } from "@/lib/i18n";
import { motion } from "framer-motion";
import { User, Mail, Phone, Crown, Calendar, LogOut, Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { lang, changeLang } = useLanguage();
  const { user, profile, subscription, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    return (
      <AppLayout>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-3">
          <div className="flex flex-col items-center mt-20">
            <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-4 border-2 border-border">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-lg mb-2">Guest User</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to access your profile</p>
            <button onClick={() => navigate("/login")} className="w-full max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold py-3 rounded-lg transition-colors">
              {t("login")}
            </button>
            <button onClick={() => navigate("/signup")} className="w-full max-w-xs bg-card hover:bg-accent text-foreground font-display font-bold py-3 rounded-lg transition-colors mt-2 border border-border">
              {t("signup")}
            </button>
          </div>
        </motion.div>
      </AppLayout>
    );
  }

  const subStatus = subscription ? t("active") : t("pending");
  const subExpiry = subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : "—";

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-3">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-3 border-2 border-primary">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-lg">
            {profile?.first_name} {profile?.last_name}
          </h2>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>

        <div className="space-y-2 mb-6">
          <InfoRow icon={Mail} label={t("email")} value={user.email || "—"} />
          <InfoRow icon={Phone} label={t("phone")} value={profile?.phone || "—"} />
          <InfoRow icon={Crown} label={t("subscriptionStatus")} value={subStatus} valueColor={subscription ? "text-green-500" : "text-gold"} />
          <InfoRow icon={Calendar} label={t("subscriptionExpiry")} value={subExpiry} />
        </div>

        {/* Language */}
        <div className="bg-card rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{t("language")}</span>
            </div>
            <div className="flex gap-1">
              {["en", "sw"].map((l) => (
                <button key={l} onClick={() => changeLang(l)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="w-full bg-card hover:bg-accent border border-border text-foreground font-display font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" /> {t("logout")}
        </button>
      </motion.div>
    </AppLayout>
  );
};

const InfoRow = ({ icon: Icon, label, value, valueColor = "" }: { icon: any; label: string; value: string; valueColor?: string }) => (
  <div className="bg-card rounded-lg p-3 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm">{label}</span>
    </div>
    <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
  </div>
);

export default Profile;
