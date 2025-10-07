import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Shield, Clock, Award, CheckCircle2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Sécurisé & Fiable",
      description: "Plateforme sécurisée avec des contrats transparents et garantis",
    },
    {
      icon: Clock,
      title: "Gains Hebdomadaires",
      description: "Recevez vos retours chaque semaine pendant 48 semaines",
    },
    {
      icon: Award,
      title: "ROI Attractif",
      description: "Des rendements compétitifs sur tous nos packs d'investissement",
    },
    {
      icon: TrendingUp,
      title: "Capital Protégé",
      description: "Votre capital initial est retirable à la fin du contrat",
    },
  ];

  const stats = [
    { value: "9", label: "Packs disponibles" },
    { value: "48", label: "Semaines de contrat" },
    { value: "100%", label: "Transparence" },
    { value: "24/7", label: "Support disponible" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 gradient-hero opacity-90" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 shadow-soft">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-sm font-medium">Plateforme d'investissement sécurisée</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-primary-foreground">
              AIDA
            </h1>
            <p className="text-2xl md:text-3xl font-semibold mb-4 text-primary-foreground/90">
              Aide Internationale de la Diaspora Africaine
            </p>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Investissez intelligemment avec des retours hebdomadaires garantis.
              Choisissez parmi 9 packs adaptés à vos objectifs financiers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/packs")}
                className="gradient-gold text-primary text-lg font-semibold px-8 py-6 shadow-gold hover:scale-105 transition-transform"
              >
                Découvrir les packs
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6 bg-card/80 backdrop-blur-sm"
              >
                Créer un compte
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-soft"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-transparent bg-clip-text drop-shadow-md mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pourquoi choisir AIDA ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une plateforme moderne conçue pour maximiser vos rendements en toute
              sécurité
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-background rounded-xl p-6 shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center mb-4 shadow-gold">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Commencez à investir en 4 étapes simples
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              {
                step: "01",
                title: "Créez votre compte",
                description: "Inscription rapide et sécurisée en quelques minutes",
              },
              {
                step: "02",
                title: "Créditez votre wallet",
                description: "Ajoutez des fonds en toute sécurité",
              },
              {
                step: "03",
                title: "Choisissez votre pack",
                description: "Sélectionnez parmi 9 packs adaptés à votre budget",
              },
              {
                step: "04",
                title: "Recevez vos gains",
                description: "Gains hebdomadaires automatiques pendant 48 semaines",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-muted/20 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            Prêt à commencer votre parcours d'investissement ?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Rejoignez AIDA aujourd'hui et profitez de retours hebdomadaires garantis
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="gradient-gold text-primary text-lg font-semibold px-8 py-6 shadow-gold hover:scale-105 transition-transform"
          >
            Commencer maintenant
            <TrendingUp className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center shadow-gold">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">AIDA</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 AIDA - Aide Internationale de la Diaspora Africaine. Tous droits
            réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
