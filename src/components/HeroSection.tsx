import { ArrowRight, BarChart3, Wifi, CloudSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';

const HeroSection = () => {
  const scrollToContact = () => {
    const element = document.querySelector('#kontak');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="beranda" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Smart farming technology"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-leaf/10 text-leaf font-medium text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-leaf animate-pulse" />
              Platform Agritech Terdepan di Indonesia
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Data Akurat,{' '}
            <span className="text-gradient">Pertanian Lebih Cerdas</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            AlmondSense menghadirkan solusi teknologi IoT dan AI untuk pemantauan lahan, 
            analisis tanaman, dan pengambilan keputusan berbasis data yang membantu 
            petani meningkatkan produktivitas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" size="xl" onClick={scrollToContact}>
              Konsultasi Gratis
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="xl" onClick={() => document.querySelector('#tentang')?.scrollIntoView({ behavior: 'smooth' })}>
              Pelajari Lebih Lanjut
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50">
              <div className="w-12 h-12 rounded-lg bg-leaf/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-leaf" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">98%</p>
                <p className="text-sm text-muted-foreground">Akurasi Data</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wifi className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">24/7</p>
                <p className="text-sm text-muted-foreground">Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50">
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                <CloudSun className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Hektar Terpantau</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default HeroSection;
