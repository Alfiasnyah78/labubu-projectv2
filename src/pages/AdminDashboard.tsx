import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, LogOut, Trash2, Edit2, X, Check, Search, Calendar, Users, FileText, RefreshCw, Clock, CheckCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  getSubmissions, 
  deleteSubmission, 
  updateSubmission, 
  FormSubmission, 
  SubmissionStatus,
  getProfiles,
  updateProfile,
  deleteProfile,
  UserProfile
} from '@/lib/formStorage';

const statusConfig: Record<SubmissionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: <Clock className="w-3 h-3" />
  },
  negosiasi: { 
    label: 'Negosiasi', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: <MessageSquare className="w-3 h-3" />
  },
  success: { 
    label: 'Success', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: <CheckCircle className="w-3 h-3" />
  },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FormSubmission>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/AdminLabubu');
          return;
        }

        // Check if user has admin role using the has_role function or direct query
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        if (rolesError) {
          console.error('Error checking roles:', rolesError);
          navigate('/AdminLabubu');
          return;
        }

        const hasAdminRole = roles?.some(r => r.role === 'admin');

        if (!hasAdminRole) {
          toast({
            title: "Akses Ditolak",
            description: "Anda tidak memiliki akses admin.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          navigate('/AdminLabubu');
          return;
        }

        setIsAuthenticated(true);
        loadData();
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/AdminLabubu');
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        navigate('/AdminLabubu');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const loadData = async () => {
    setIsLoading(true);
    const [submissionsData, profilesData] = await Promise.all([
      getSubmissions(),
      getProfiles()
    ]);
    setSubmissions(submissionsData);
    setProfiles(profilesData);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout Berhasil",
      description: "Anda telah keluar dari dashboard.",
    });
    navigate('/AdminLabubu');
  };

  // Submission handlers
  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      const success = await deleteSubmission(id);
      if (success) {
        await loadData();
        toast({
          title: "Data Dihapus",
          description: "Data berhasil dihapus dari sistem.",
        });
      } else {
        toast({
          title: "Gagal Menghapus",
          description: "Terjadi kesalahan saat menghapus data.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (submission: FormSubmission) => {
    setEditingId(submission.id);
    setEditForm(submission);
  };

  const handleSaveEdit = async () => {
    if (editingId && editForm) {
      const result = await updateSubmission(editingId, editForm);
      if (result) {
        await loadData();
        setEditingId(null);
        setEditForm({});
        toast({
          title: "Data Diperbarui",
          description: "Perubahan berhasil disimpan.",
        });
      } else {
        toast({
          title: "Gagal Memperbarui",
          description: "Terjadi kesalahan saat memperbarui data.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleStatusChange = async (id: string, newStatus: SubmissionStatus) => {
    const result = await updateSubmission(id, { status: newStatus });
    if (result) {
      await loadData();
      toast({
        title: "Status Diperbarui",
        description: `Status berhasil diubah ke ${statusConfig[newStatus].label}.`,
      });
    }
  };

  // User handlers
  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      const success = await deleteProfile(id);
      if (success) {
        await loadData();
        toast({
          title: "User Dihapus",
          description: "User berhasil dihapus dari sistem.",
        });
      } else {
        toast({
          title: "Gagal Menghapus",
          description: "Terjadi kesalahan saat menghapus user.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditUser = (profile: UserProfile) => {
    setEditingUserId(profile.id);
    setEditUserForm(profile);
  };

  const handleSaveUserEdit = async () => {
    if (editingUserId && editUserForm) {
      const result = await updateProfile(editingUserId, editUserForm);
      if (result) {
        await loadData();
        setEditingUserId(null);
        setEditUserForm({});
        toast({
          title: "User Diperbarui",
          description: "Data user berhasil disimpan.",
        });
      } else {
        toast({
          title: "Gagal Memperbarui",
          description: "Terjadi kesalahan saat memperbarui user.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelUserEdit = () => {
    setEditingUserId(null);
    setEditUserForm({});
  };

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.company?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (p.company?.toLowerCase() || '').includes(userSearchTerm.toLowerCase()) ||
      (p.phone?.toLowerCase() || '').includes(userSearchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusCounts = {
    pending: submissions.filter(s => s.status === 'pending').length,
    negosiasi: submissions.filter(s => s.status === 'negosiasi').length,
    success: submissions.filter(s => s.status === 'success').length,
  };

  // Don't render until authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-leaf to-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-serif font-bold text-foreground">AlmondSense</span>
                <span className="ml-2 text-sm text-muted-foreground">Admin Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card variant="feature">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{submissions.length}</p>
                <p className="text-sm text-muted-foreground">Total Pengajuan</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="feature">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-7 h-7 text-yellow-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{statusCounts.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="feature">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{statusCounts.negosiasi}</p>
                <p className="text-sm text-muted-foreground">Negosiasi</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="feature">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{statusCounts.success}</p>
                <p className="text-sm text-muted-foreground">Success</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pengajuan
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users ({profiles.length})
            </TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-foreground">Data Pengajuan Layanan</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground">Memuat data...</p>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Tidak ada hasil pencarian.' : 'Belum ada pengajuan.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Nama</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Kontak</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Layanan</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Tanggal</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubmissions.map((submission) => (
                          <tr
                            key={submission.id}
                            className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              {editingId === submission.id ? (
                                <Input
                                  value={editForm.name || ''}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="h-8"
                                />
                              ) : (
                                <div>
                                  <p className="font-medium text-foreground">{submission.name}</p>
                                  <p className="text-sm text-muted-foreground">{submission.company || '-'}</p>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {editingId === submission.id ? (
                                <div className="space-y-1">
                                  <Input
                                    value={editForm.email || ''}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="h-8"
                                  />
                                  <Input
                                    value={editForm.phone || ''}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="h-8"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm text-foreground">{submission.email}</p>
                                  <p className="text-sm text-muted-foreground">{submission.phone}</p>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {editingId === submission.id ? (
                                <Input
                                  value={editForm.service || ''}
                                  onChange={(e) => setEditForm({ ...editForm, service: e.target.value })}
                                  className="h-8"
                                />
                              ) : (
                                <div>
                                  <span className="inline-block px-2 py-1 rounded-full bg-leaf/10 text-leaf text-xs font-medium">
                                    {submission.service}
                                  </span>
                                  {submission.land_size && (
                                    <p className="text-xs text-muted-foreground mt-1">{submission.land_size}</p>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {editingId === submission.id ? (
                                <select
                                  value={editForm.status || 'pending'}
                                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as SubmissionStatus })}
                                  className="h-8 px-2 rounded border border-input bg-background text-sm"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="negosiasi">Negosiasi</option>
                                  <option value="success">Success</option>
                                </select>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={submission.status}
                                    onChange={(e) => handleStatusChange(submission.id, e.target.value as SubmissionStatus)}
                                    className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${statusConfig[submission.status].color}`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="negosiasi">Negosiasi</option>
                                    <option value="success">Success</option>
                                  </select>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {formatDate(submission.created_at)}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {editingId === submission.id ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    className="text-gray-600 hover:text-gray-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(submission)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(submission.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Message display */}
                    {filteredSubmissions.some(s => s.message) && (
                      <div className="mt-6 space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Pesan dari Pelanggan
                        </h3>
                        {filteredSubmissions.filter(s => s.message).map((submission) => (
                          <div
                            key={`msg-${submission.id}`}
                            className="bg-muted/50 rounded-lg p-4 border border-border"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium text-foreground">{submission.name}</p>
                                <p className="text-sm text-muted-foreground">{submission.email}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[submission.status].color}`}>
                                {statusConfig[submission.status].label}
                              </span>
                            </div>
                            <p className="mt-3 text-foreground whitespace-pre-wrap">{submission.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-foreground">Data User Terdaftar</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama, perusahaan..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground">Memuat data...</p>
                  </div>
                ) : filteredProfiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {userSearchTerm ? 'Tidak ada hasil pencarian.' : 'Belum ada user terdaftar.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Nama</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Perusahaan</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Telepon</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Bergabung</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProfiles.map((profile) => (
                          <tr
                            key={profile.id}
                            className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              {editingUserId === profile.id ? (
                                <Input
                                  value={editUserForm.full_name || ''}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
                                  className="h-8"
                                />
                              ) : (
                                <p className="font-medium text-foreground">{profile.full_name}</p>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {editingUserId === profile.id ? (
                                <Input
                                  value={editUserForm.company || ''}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, company: e.target.value })}
                                  className="h-8"
                                />
                              ) : (
                                <p className="text-foreground">{profile.company || '-'}</p>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {editingUserId === profile.id ? (
                                <Input
                                  value={editUserForm.phone || ''}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                                  className="h-8"
                                />
                              ) : (
                                <p className="text-foreground">{profile.phone || '-'}</p>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {formatDate(profile.created_at)}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {editingUserId === profile.id ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSaveUserEdit}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelUserEdit}
                                    className="text-gray-600 hover:text-gray-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUser(profile)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(profile.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
