import { Leaf, Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    layanan: [
      { name: 'Pemantauan IoT', href: '#layanan' },
      { name: 'Analisis AI', href: '#layanan' },
      { name: 'Dashboard', href: '#layanan' },
      { name: 'Konsultasi', href: '#kontak' },
    ],
    perusahaan: [
      { name: 'Tentang Kami', href: '#tentang' },
      { name: 'Tim', href: '#tim' },
      { name: 'Karir', href: '#' },
      { name: 'Blog', href: '#' },
    ],
    dukungan: [
      { name: 'Pusat Bantuan', href: '#' },
      { name: 'Dokumentasi', href: '#' },
      { name: 'FAQ', href: '#' },
      { name: 'Hubungi Kami', href: '#kontak' },
    ],
  };

  const socials = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="bg-earth text-almond-light">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#beranda" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-leaf to-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-serif font-bold">
                Almond<span className="text-gold">Sense</span>
              </span>
            </a>
            <p className="text-almond-light/70 mb-6 max-w-sm">
              Platform teknologi agrikultur berbasis IoT dan AI untuk pemantauan lahan, 
              analisis tanaman, dan pengambilan keputusan berbasis data.
            </p>
            <p className="text-sm font-medium text-gold">
              Data Akurat, Pertanian Lebih Cerdas.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-serif font-bold mb-4">Layanan</h4>
            <ul className="space-y-2">
              {links.layanan.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-almond-light/70 hover:text-gold transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold mb-4">Perusahaan</h4>
            <ul className="space-y-2">
              {links.perusahaan.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-almond-light/70 hover:text-gold transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold mb-4">Dukungan</h4>
            <ul className="space-y-2">
              {links.dukungan.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-almond-light/70 hover:text-gold transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-almond-light/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-almond-light/60">
            © {currentYear} AlmondSense. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex gap-4">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="w-10 h-10 rounded-full bg-almond-light/10 flex items-center justify-center text-almond-light/70 hover:bg-gold hover:text-earth transition-colors"
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
