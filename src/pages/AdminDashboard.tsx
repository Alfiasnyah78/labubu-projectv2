import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, LogOut, Trash2, Edit2, X, Check, Search, Calendar, Users, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getSubmissions, deleteSubmission, updateSubmission, FormSubmission } from '@/lib/formStorage';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FormSubmission>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      navigate('/AdminLabubu');
      return;
    }
    loadSubmissions();
  }, [navigate]);

  const loadSubmissions = async () => {
    setIsLoading(true);
    const data = await getSubmissions();
    setSubmissions(data);
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      const success = await deleteSubmission(id);
      if (success) {
        await loadSubmissions();
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
        await loadSubmissions();
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

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.company?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
              <Button variant="ghost" size="sm" onClick={loadSubmissions} disabled={isLoading}>
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
              <div className="w-14 h-14 rounded-2xl bg-leaf/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-leaf" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {new Set(submissions.map((s) => s.email)).size}
                </p>
                <p className="text-sm text-muted-foreground">Calon Pelanggan</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="feature">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-gold" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {submissions.filter(
                    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
                <p className="text-sm text-muted-foreground">Pengajuan Hari Ini</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
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
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Luas Lahan</th>
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
                            <span className="inline-block px-2 py-1 rounded-full bg-leaf/10 text-leaf text-xs font-medium">
                              {submission.service}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {editingId === submission.id ? (
                            <Input
                              value={editForm.land_size || ''}
                              onChange={(e) => setEditForm({ ...editForm, land_size: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            <span className="text-foreground">{submission.land_size || '-'}</span>
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
                      <span className="text-sm text-muted-foreground">
                        {formatDate(submission.created_at)}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{submission.message}</p>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
