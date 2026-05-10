import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOGO_URL = "https://i.imgur.com/ll3OOCp.jpeg";

const AuthPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = 'Email inahitajika';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email si sahihi';
    if (!form.password) errs.password = 'Password inahitajika';
    else if (form.password.length < 6) errs.password = 'Password lazima iwe angalau herufi 6';
    if (isSignUp) {
      if (!form.firstName.trim()) errs.firstName = 'Jina linahitajika';
      if (!form.lastName.trim()) errs.lastName = 'Jina la pili linahitajika';
      if (!form.phone.trim()) errs.phone = 'Namba ya simu inahitajika';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(form.email, form.password, form.firstName, form.lastName, form.phone);
        toast.success('Akaunti imeundwa! Angalia email yako kwa uthibitisho');
      } else {
        await signIn(form.email, form.password);
        toast.success('Umeingia kikamilifu!');
      }
    } catch (err: any) {
      const msg = err.message || 'Kuna tatizo, jaribu tena';
      if (msg.includes('Invalid login')) toast.error('Email au password si sahihi');
      else if (msg.includes('Email not confirmed')) toast.error('Tafadhali thibitisha email yako kwanza');
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      toast.error('Tafadhali ingiza email sahihi');
      return;
    }
    setLoading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      toast.success('Link ya kubadilisha password imetumwa kwenye email yako');
      setShowForgotPassword(false);
    } catch {
      toast.error('Kuna tatizo, jaribu tena');
    } finally {
      setLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-[#0a0a0a] to-[#0a0a0a] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex flex-col items-center gap-2 mb-3">
            <img
              src={LOGO_URL}
              alt="LOFT Tv"
              className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-primary/20"
            />
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              LOFT <span className="text-primary">Tv</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
            {showForgotPassword ? 'Badilisha Password' : isSignUp ? 'Jisajili Sasa' : 'Karibu Tena'}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-card/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-border shadow-2xl shadow-primary/5"
        >
          <AnimatePresence mode="wait">
            {showForgotPassword ? (
              <motion.form
                key="forgot"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleForgotPassword}
                className="space-y-5"
              >
                <p className="text-sm text-muted-foreground">
                  Ingiza email yako na tutakutumia link ya kubadilisha password.
                </p>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-bold uppercase ml-1">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                      className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all h-11 pl-10 rounded-xl"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl transition-all active:scale-[0.98]" disabled={loading}>
                  {loading ? <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : 'Tuma Link'}
                </Button>
                <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Rudi kwenye Login
                </button>
              </motion.form>
            ) : (
              <motion.form
                key={isSignUp ? 'signup' : 'login'}
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {isSignUp && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs font-bold uppercase ml-1">Jina la Kwanza</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={form.firstName}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            placeholder="Jina"
                            className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all h-11 pl-10 rounded-xl"
                          />
                        </div>
                        {errors.firstName && <p className="text-xs text-destructive ml-1">{errors.firstName}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs font-bold uppercase ml-1">Jina la Pili</Label>
                        <Input
                          value={form.lastName}
                          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                          placeholder="Ukoo"
                          className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all h-11 rounded-xl"
                        />
                        {errors.lastName && <p className="text-xs text-destructive ml-1">{errors.lastName}</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-xs font-bold uppercase ml-1">Namba ya Simu</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+255..."
                          className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all h-11 pl-10 rounded-xl"
                        />
                      </div>
                      {errors.phone && <p className="text-xs text-destructive ml-1">{errors.phone}</p>}
                    </div>
                  </motion.div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-bold uppercase ml-1">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                      className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all h-11 pl-10 rounded-xl"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-bold uppercase ml-1">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary transition-all h-11 pl-10 pr-10 rounded-xl"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive ml-1">{errors.password}</p>}
                </div>

                {!isSignUp && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-border bg-background/50 text-primary accent-primary"
                      />
                      <span className="text-xs text-muted-foreground">Nikumbuke</span>
                    </label>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                      Umesahau Password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-sm rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Inasubiri...
                    </div>
                  ) : isSignUp ? 'JISAJILI' : 'INGIA'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {!showForgotPassword && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setErrors({}); }}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {isSignUp ? (
                  <span>Una akaunti? <span className="text-primary font-bold ml-1">Ingia hapa</span></span>
                ) : (
                  <span>Huna akaunti? <span className="text-primary font-bold ml-1">Jisajili sasa</span></span>
                )}
              </button>
            </div>
          )}
        </motion.div>

        <p className="text-center mt-8 text-muted-foreground/50 text-[10px] uppercase tracking-[0.2em]">
          © 2026 Quantum Team • Entertainment Unlimited
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
