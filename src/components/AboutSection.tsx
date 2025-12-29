import { Target, Eye, Heart, Lightbulb, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AboutSection = () => {
  const missions = [
    "Menghadirkan sistem pemantauan lahan yang terukur dan real-time.",
    "Memberikan insight berbasis AI untuk mendukung keputusan pertanian.",
    "Mempermudah proses analisis kondisi tanaman, cuaca, dan tanah.",
    "Menyediakan platform yang terjangkau bagi petani dan UMKM agribisnis.",
    "Mendorong transformasi digital sektor agrikultur secara berkelanjutan.",
  ];

  const goals = [
    {
      icon: TrendingUp,
      title: "Meningkatkan Produktivitas",
      description: "Meningkatkan hasil panen dan efisiensi penggunaan sumber daya.",
    },
    {
      icon: Target,
      title: "Mengurangi Risiko",
      description: "Mengurangi risiko gagal panen melalui data prediktif.",
    },
    {
      icon: Users,
      title: "Solusi Untuk Semua",
      description: "Memberikan solusi yang dapat digunakan oleh petani skala kecil hingga perusahaan besar.",
    },
    {
      icon: Lightbulb,
      title: "Ekosistem Terintegrasi",
      description: "Menciptakan ekosistem agritech yang terintegrasi di Indonesia.",
    },
  ];

  return (
    <section id="tentang" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            Tentang Kami
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">
            Teknologi untuk Bumi yang Lebih Subur
          </h2>
          <p className="text-lg text-muted-foreground">
            AlmondSense percaya bahwa data dapat membantu petani membuat keputusan 
            yang lebih tepat, efisien, dan menguntungkan.
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Vision */}
          <Card variant="feature" className="p-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-gold flex items-center justify-center flex-shrink-0">
                <Eye className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-foreground mb-4">Visi</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Menjadi pelopor solusi pertanian digital di Indonesia yang membantu 
                  petani dan pelaku agribisnis meningkatkan produktivitas melalui 
                  teknologi yang mudah diakses dan akurat.
                </p>
              </div>
            </div>
          </Card>

          {/* Mission */}
          <Card variant="feature" className="p-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-leaf to-leaf-light flex items-center justify-center flex-shrink-0">
                <Target className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-foreground mb-4">Misi</h3>
                <ul className="space-y-2">
                  {missions.map((mission, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-leaf mt-2 flex-shrink-0" />
                      <span>{mission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Goals */}
        <div className="mb-16">
          <h3 className="text-2xl font-serif font-bold text-foreground text-center mb-8">Tujuan Kami</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {goals.map((goal, index) => (
              <Card key={index} variant="default" className="p-6 text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-almond to-almond-light flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <goal.icon className="w-8 h-8 text-almond-dark" />
                </div>
                <h4 className="font-serif font-bold text-foreground mb-2">{goal.title}</h4>
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Philosophy */}
        <Card variant="glass" className="p-8 md:p-12 text-center bg-gradient-to-br from-leaf/5 to-primary/5">
          <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
          <h3 className="text-2xl font-serif font-bold text-foreground mb-4">Filosofi Perusahaan</h3>
          <blockquote className="text-xl md:text-2xl text-muted-foreground italic max-w-2xl mx-auto">
            "Teknologi untuk bumi yang lebih subur."
          </blockquote>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            AlmondSense percaya bahwa data dapat membantu petani membuat keputusan 
            yang lebih tepat, efisien, dan menguntungkan.
          </p>
        </Card>
      </div>
    </section>
  );
};

export default AboutSection;
