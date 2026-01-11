import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Leaf, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().trim().email({ message: "Format email tidak valid" }).max(255),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }).max(128),
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  // Check if already logged in as admin
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check admin role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);
        
        const isAdmin = roles?.some(r => r.role === 'admin');
        if (isAdmin) {
          navigate('/AdminLabubu/dashboard');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate input
    const validation = loginSchema.safeParse(credentials);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Input tidak valid";
      toast({
        title: "Validasi Gagal",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        toast({
          title: "Login Gagal",
          description: "Email atau password salah.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        toast({
          title: "Login Gagal",
          description: "Tidak dapat membuat sesi.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if user has admin role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.session.user.id);

      if (rolesError) {
        toast({
          title: "Error",
          description: "Tidak dapat memverifikasi role.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      const isAdmin = roles?.some(r => r.role === 'admin');

      if (!isAdmin) {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki akses admin.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      toast({
        title: "Login Berhasil",
        description: "Selamat datang di Dashboard Admin.",
      });
      navigate('/AdminLabubu/dashboard');
    } catch (err) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat login.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-almond-light p-4">
      <Card variant="elevated" className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-leaf to-primary flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Masuk ke Dashboard AlmondSense
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
                placeholder="Masukkan email admin"
                className="h-12 pl-11"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                placeholder="Masukkan password"
                className="h-12 pl-11 pr-11"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                Memproses...
              </>
            ) : (
              'Masuk'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <a href="/" className="text-primary hover:underline">
            Kembali ke Beranda
          </a>
        </p>
      </Card>
    </div>
  );
};

export default AdminLogin;
