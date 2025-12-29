import { useState } from 'react';
import { Send, MapPin, Phone, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { addSubmission } from '@/lib/formStorage';

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    landSize: '',
    message: '',
  });

  const services = [
    "Pemantauan IoT Real-time",
    "Analisis AI Prediktif",
    "Prakiraan Cuaca Lokal",
    "Manajemen Tanaman",
    "Dashboard Analitik",
    "Paket Lengkap",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      addSubmission(formData);
      
      setIsSubmitted(true);
      toast({
        title: "Berhasil Terkirim!",
        description: "Tim kami akan menghubungi Anda dalam 1x24 jam.",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        service: '',
        landSize: '',
        message: '',
      });

      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (error) {
      toast({
        title: "Gagal Mengirim",
        description: "Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="kontak" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-gold/10 text-gold font-medium text-sm mb-4">
            Hubungi Kami
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">
            Mulai Perjalanan Pertanian Digital Anda
          </h2>
          <p className="text-lg text-muted-foreground">
            Isi formulir di bawah ini dan tim kami akan menghubungi Anda 
            untuk konsultasi gratis tentang kebutuhan pertanian Anda.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card variant="feature" className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Alamat</h4>
                  <p className="text-sm text-muted-foreground">
                    Jl. Teknologi Pertanian No. 123<br />
                    Jakarta Selatan, Indonesia
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="feature" className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-leaf/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-leaf" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Telepon</h4>
                  <p className="text-sm text-muted-foreground">
                    +62 21 1234 5678<br />
                    +62 812 3456 7890
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="feature" className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Email</h4>
                  <p className="text-sm text-muted-foreground">
                    info@almondsense.id<br />
                    support@almondsense.id
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <Card variant="elevated" className="lg:col-span-2 p-8">
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-scale-in">
                <div className="w-20 h-20 rounded-full bg-leaf/10 flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-leaf" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground mb-2">
                  Terima Kasih!
                </h3>
                <p className="text-muted-foreground">
                  Formulir Anda telah berhasil dikirim. Tim kami akan segera menghubungi Anda.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Nama Lengkap *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Masukkan nama lengkap"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="nama@email.com"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                      Nomor Telepon *
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+62 812 3456 7890"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                      Nama Perusahaan/Usaha
                    </label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Nama usaha Anda"
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-foreground mb-2">
                      Layanan yang Dibutuhkan *
                    </label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      required
                      className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Pilih layanan</option>
                      {services.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="landSize" className="block text-sm font-medium text-foreground mb-2">
                      Luas Lahan
                    </label>
                    <Input
                      id="landSize"
                      name="landSize"
                      value={formData.landSize}
                      onChange={handleChange}
                      placeholder="Contoh: 5 hektar"
                      className="h-12"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Pesan atau Kebutuhan Khusus
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Ceritakan kebutuhan pertanian Anda..."
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      Kirim Formulir
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
