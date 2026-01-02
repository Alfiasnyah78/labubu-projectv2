import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, LogOut, Trash2, Edit2, X, Check, Search, Calendar, Users, FileText, RefreshCw, Clock, CheckCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
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

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      navigate('/AdminLabubu');
      return;
    }
    loadData();
  }, [navigate]);

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

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
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
                                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig[submission.status].color} border-0 cursor-pointer`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="negosiasi">Negosiasi</option>
                                    <option value="success">Success</option>
                                  </select>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-muted-foreground">
                                {formatDate(submission.created_at)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                {editingId === submission.id ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleSaveEdit}
                                      className="h-8 w-8 text-leaf hover:text-leaf"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleCancelEdit}
                                      className="h-8 w-8 text-muted-foreground"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(submission)}
                                      className="h-8 w-8 text-primary hover:text-primary"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(submission.id)}
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Details */}
            {filteredSubmissions.some((s) => s.message) && (
              <Card variant="default" className="mt-8">
                <CardHeader>
                  <CardTitle className="text-foreground">Pesan Pelanggan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredSubmissions
                    .filter((s) => s.message)
                    .map((submission) => (
                      <div key={submission.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{submission.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[submission.status].color}`}>
                              {statusConfig[submission.status].label}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(submission.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className="text-muted-foreground">{submission.message}</p>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-foreground">Kelola Users</CardTitle>
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
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Telepon</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Perusahaan</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Terdaftar</th>
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
                                <p className="font-medium text-foreground">{profile.full_name || '-'}</p>
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
                              <span className="text-sm text-muted-foreground">
                                {formatDate(profile.created_at)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                {editingUserId === profile.id ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleSaveUserEdit}
                                      className="h-8 w-8 text-leaf hover:text-leaf"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleCancelUserEdit}
                                      className="h-8 w-8 text-muted-foreground"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditUser(profile)}
                                      className="h-8 w-8 text-primary hover:text-primary"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteUser(profile.id)}
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
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
