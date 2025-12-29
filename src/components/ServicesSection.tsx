import { Wifi, Brain, CloudSun, Sprout, BarChart3, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const ServicesSection = () => {
  const services = [
    {
      icon: Wifi,
      title: "Pemantauan IoT Real-time",
      description: "Sensor pintar yang memantau kelembaban tanah, suhu, dan kondisi lahan secara real-time 24/7.",
      features: ["Sensor kelembaban tanah", "Monitoring suhu", "Data cuaca lokal"],
    },
    {
      icon: Brain,
      title: "Analisis AI Prediktif",
      description: "Kecerdasan buatan yang menganalisis data untuk memberikan rekomendasi pertanian yang akurat.",
      features: ["Prediksi panen", "Deteksi hama", "Rekomendasi pupuk"],
    },
    {
      icon: CloudSun,
      title: "Prakiraan Cuaca Lokal",
      description: "Data cuaca hiper-lokal untuk perencanaan aktivitas pertanian yang lebih tepat.",
      features: ["Cuaca 7 hari", "Alert hujan", "Peringatan ekstrem"],
    },
    {
      icon: Sprout,
      title: "Manajemen Tanaman",
      description: "Sistem terintegrasi untuk mengelola seluruh siklus pertumbuhan tanaman Anda.",
      features: ["Jadwal tanam", "Tracking pertumbuhan", "Riwayat lahan"],
    },
    {
      icon: BarChart3,
      title: "Dashboard Analitik",
      description: "Visualisasi data yang mudah dipahami untuk pengambilan keputusan yang lebih baik.",
      features: ["Grafik interaktif", "Laporan berkala", "Export data"],
    },
    {
      icon: Shield,
      title: "Keamanan Data",
      description: "Perlindungan data pertanian Anda dengan enkripsi dan backup otomatis.",
      features: ["Enkripsi end-to-end", "Backup harian", "Akses kontrol"],
    },
  ];

  return (
    <section id="layanan" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-leaf/10 text-leaf font-medium text-sm mb-4">
            Layanan Kami
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">
            Solusi Lengkap untuk Pertanian Modern
          </h2>
          <p className="text-lg text-muted-foreground">
            Kami menyediakan berbagai layanan teknologi yang dirancang khusus 
            untuk membantu Anda mengoptimalkan hasil pertanian.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} variant="feature" className="group">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-leaf/20 to-primary/20 flex items-center justify-center mb-4 group-hover:from-leaf group-hover:to-primary transition-all duration-300">
                  <service.icon className="w-7 h-7 text-leaf group-hover:text-primary-foreground transition-colors" />
                </div>
                <CardTitle className="text-foreground">{service.title}</CardTitle>
                <CardDescription className="text-base">{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
