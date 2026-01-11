import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Leaf, Package, Clock, CheckCircle, AlertCircle, Phone, Mail, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface FormSubmission {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  service: string;
  land_size: string | null;
  message: string | null;
}

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  company: string | null;
}

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/pelanggan');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/pelanggan');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSubmissions();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchSubmissions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    // Query by user_id for proper data isolation
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubmissions(data);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Logout Berhasil',
      description: 'Sampai jumpa kembali!',
    });
    navigate('/pelanggan');
  };

  const getStatusInfo = (createdAt: string) => {
    const daysSince = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince < 1) {
      return { status: 'Baru Diterima', color: 'text-blue-500', icon: AlertCircle, bg: 'bg-blue-50' };
    } else if (daysSince < 3) {
      return { status: 'Sedang Diproses', color: 'text-gold', icon: Clock, bg: 'bg-gold/10' };
    } else if (daysSince < 7) {
      return { status: 'Dalam Review', color: 'text-leaf', icon: Package, bg: 'bg-leaf/10' };
    } else {
      return { status: 'Selesai', color: 'text-primary', icon: CheckCircle, bg: 'bg-primary/10' };
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-almond-light">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-leaf to-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-foreground">Dashboard Pelanggan</h1>
              <p className="text-sm text-muted-foreground">AlmondSense</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{profile?.full_name || user.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Profile Card */}
        <Card variant="elevated" className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-serif font-bold text-foreground mb-4">Profil Anda</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-leaf/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-leaf" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium text-foreground">{profile?.full_name || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telepon</p>
                  <p className="font-medium text-foreground">{profile?.phone || '-'}</p>
                </div>
              </div>
              {profile?.company && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Perusahaan</p>
                    <p className="font-medium text-foreground">{profile.company}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Requests */}
        <div className="mb-6">
          <h2 className="text-xl font-serif font-bold text-foreground mb-4">
            Layanan Anda ({submissions.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        ) : submissions.length === 0 ? (
          <Card variant="elevated" className="p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Belum Ada Layanan</h3>
            <p className="text-muted-foreground mb-6">
              Anda belum memiliki permintaan layanan. Hubungi kami untuk memulai!
            </p>
            <Button variant="hero" onClick={() => navigate('/#kontak')}>
              Ajukan Layanan
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => {
              const statusInfo = getStatusInfo(submission.created_at);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={submission.id} variant="elevated" className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">
                          {submission.service}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Diajukan: {new Date(submission.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        {submission.land_size && (
                          <div>
                            <p className="text-muted-foreground">Luas Lahan</p>
                            <p className="font-medium text-foreground">{submission.land_size}</p>
                          </div>
                        )}
                        {submission.company && (
                          <div>
                            <p className="text-muted-foreground">Perusahaan</p>
                            <p className="font-medium text-foreground">{submission.company}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {submission.message && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">Pesan:</p>
                        <p className="text-foreground">{submission.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <a href="/" className="text-primary hover:underline text-sm">
            ← Kembali ke Beranda
          </a>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;
