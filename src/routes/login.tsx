import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate({ to: '/dashboard' });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — premium branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 gradient-primary animate-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.15)_0%,transparent_50%)]" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-white/8 blur-2xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        
        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight text-white">ZeroDay</span>
          </div>

          <div className="max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              Trusted by 500+ security teams
            </div>
            <h1 className="text-5xl font-display font-bold leading-[1.1] tracking-tight text-white">
              Continuous compliance,<br />automated.
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              Monitor SOC 2, ISO 27001, HIPAA, GDPR, and PCI DSS from a single pane of glass.
            </p>
          </div>

          <p className="text-sm text-white/40">© 2026 ZeroDay Security</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12 bg-background relative">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/3" />
        
        <div className="w-full max-w-sm space-y-8 relative z-10 animate-fade-up">
          <div className="lg:hidden flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
              <Shield className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-display font-bold text-foreground">ZeroDay</span>
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive animate-scale-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="pl-10 h-11 rounded-xl bg-surface border-border/60 transition-all focus:border-primary focus:shadow-glow"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-glow transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 rounded-xl bg-surface border-border/60 transition-all focus:border-primary focus:shadow-glow"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl gradient-primary text-white font-medium shadow-glow hover:opacity-90 transition-all" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl border-border/60 hover:bg-surface hover:border-primary/30 transition-all"
            disabled={loading}
            onClick={async () => {
              setError('');
              setLoading(true);
              const result = await lovable.auth.signInWithOAuth('google', {
                redirect_uri: window.location.origin,
              });
              if (result.error) {
                setError(result.error instanceof Error ? result.error.message : 'Google sign-in failed');
                setLoading(false);
                return;
              }
              if (result.redirected) return;
              navigate({ to: '/dashboard' });
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl border-border/60 hover:bg-surface hover:border-primary/30 transition-all"
            disabled={loading}
            onClick={async () => {
              setError('');
              setLoading(true);
              const result = await lovable.auth.signInWithOAuth('microsoft', {
                redirect_uri: window.location.origin,
              });
              if (result.error) {
                setError(result.error instanceof Error ? result.error.message : 'Microsoft sign-in failed');
                setLoading(false);
                return;
              }
              if (result.redirected) return;
              navigate({ to: '/dashboard' });
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z" />
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            Microsoft
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl border-border/60 hover:bg-surface hover:border-primary/30 transition-all"
            disabled={loading}
            onClick={async () => {
              setError('');
              const ssoEmail = window.prompt('Enter your work email to sign in with SSO:');
              if (!ssoEmail) return;
              const domain = ssoEmail.split('@')[1]?.trim();
              if (!domain) {
                setError('Please enter a valid email address.');
                return;
              }
              setLoading(true);
              const { data, error: ssoError } = await supabase.auth.signInWithSSO({
                domain,
                options: { redirectTo: `${window.location.origin}/dashboard` },
              });
              if (ssoError) {
                setError(ssoError.message);
                setLoading(false);
                return;
              }
              if (data?.url) {
                window.location.href = data.url;
              }
            }}
          >
            <Lock className="mr-2 h-4 w-4" />
            Sign in with SSO
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-primary hover:text-primary-glow transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}