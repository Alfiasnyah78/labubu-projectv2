import { Linkedin, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import ceoPhoto from '@/assets/team/ceo.jpg';
import ctoPhoto from '@/assets/team/cto.jpg';
import cooPhoto from '@/assets/team/coo.jpg';
import cpoPhoto from '@/assets/team/cpo.jpg';
import cfoPhoto from '@/assets/team/cfo.jpg';
import cmoPhoto from '@/assets/team/cmo.jpg';

const TeamSection = () => {
  const team = [
    {
      name: "Muhammad Lutfi Alfian",
      role: "Chief Executive Officer (CEO)",
      description: "Arah strategis, kemitraan pertanian, dan ekspansi pasar.",
      photo: ceoPhoto,
    },
    {
      name: "Muhammad Raditya Anwar",
      role: "Chief Technology Officer (CTO)",
      description: "Pengembangan teknologi IoT, AI, dan integrasi sistem.",
      photo: ctoPhoto,
    },
    {
      name: "Raffuad Munawir",
      role: "Chief Operating Officer (COO)",
      description: "Operasional harian, monitoring proyek lapangan, dan pelatihan petani.",
      photo: cooPhoto,
    },
    {
      name: "Naazila Alfa Syahrin",
      role: "Chief Product Officer (CPO)",
      description: "Pengembangan fitur aplikasi, UX, dan roadmap digital.",
      photo: cpoPhoto,
    },
    {
      name: "Nur Indah",
      role: "Chief Financial Officer (CFO)",
      description: "Pengelolaan keuangan, model bisnis, dan pendanaan.",
      photo: cfoPhoto,
    },
    {
      name: "Tri Nurjulyanti",
      role: "Chief Marketing Officer (CMO)",
      description: "Edukasi pasar, branding, dan komunitas petani digital.",
      photo: cmoPhoto,
    },
  ];

  return (
    <section id="tim" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            Tim Kami
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">
            Jajaran Founder & C-Level
          </h2>
          <p className="text-lg text-muted-foreground">
            Tim berpengalaman yang berdedikasi untuk membawa inovasi 
            teknologi ke sektor pertanian Indonesia.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <Card key={index} variant="team">
              {/* Photo */}
              <div className="aspect-square overflow-hidden">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              
              {/* Info */}
              <CardContent className="p-6">
                <h3 className="text-xl font-serif font-bold text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-primary font-medium text-sm mb-3">
                  {member.role}
                </p>
                <p className="text-muted-foreground text-sm mb-4">
                  {member.description}
                </p>
                
                {/* Social Links */}
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href="#"
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
