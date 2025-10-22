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
      title: "Secure & Reliable",
      description: "Secure platform with transparent and guaranteed contracts",
    },
    {
      icon: Clock,
      title: "Weekly Rewards",
      description: "Receive your staking rewards every week for 48 weeks",
    },
    {
      icon: Award,
      title: "Attractive APY",
      description: "Competitive yields on all our staking packs",
    },
    {
      icon: TrendingUp,
      title: "Capital Protection",
      description: "Initial capital + all earnings automatically returned to your wallet after 48 weeks",
    },
  ];

  const stats = [
    { value: "9", label: "Available packs" },
    { value: "48", label: "Contract weeks" },
    { value: "100%", label: "Transparency" },
    { value: "24/7", label: "Support available" },
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
              <span className="text-sm font-medium">Secure crypto staking platform</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-primary-foreground">
              EasyStaking
            </h1>
            <p className="text-2xl md:text-3xl font-semibold mb-4 text-primary-foreground/90">
              Your Secure Crypto Staking Platform
            </p>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Stake your crypto intelligently with guaranteed weekly rewards.
              Choose from 9 staking packs tailored to your goals.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/packs")}
                className="gradient-gold text-primary text-lg font-semibold px-8 py-6 shadow-gold hover:scale-105 transition-transform"
              >
                Discover Packs
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6 bg-card/80 backdrop-blur-sm"
              >
                Create Account
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
              Why Choose EasyStaking?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A modern platform designed to maximize your staking rewards with complete
              security
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
              How Does It Work?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start staking in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              { step: "01", title: "Create Your Account", description: "Quick and secure registration in minutes" },
              { step: "02", title: "Fund Your Wallet", description: "Add funds securely" },
              { step: "03", title: "Choose Your Pack", description: "Select from 9 staking packs tailored to your budget" },
              { step: "04", title: "Receive Your Rewards", description: "Automatic weekly staking rewards for 48 weeks" },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-muted/20 mb-4">{item.step}</div>
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
            Ready to Start Your Crypto Staking Journey?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join EasyStaking today and enjoy guaranteed weekly rewards. 
            Your capital + earnings are automatically returned after 48 weeks.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="gradient-gold text-primary text-lg font-semibold px-8 py-6 shadow-gold hover:scale-105 transition-transform"
          >
            Start Now
            <TrendingUp className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center shadow-gold">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold">EasyStaking</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Secure crypto staking platform based in Fordwich, England
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/packs" className="hover:text-primary transition-colors">Staking Packs</a></li>
                <li><a href="/auth" className="hover:text-primary transition-colors">Login</a></li>
                <li><a href="/dashboard" className="hover:text-primary transition-colors">Dashboard</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a href="https://x.com/easystaking_?t=o1_QvJgFwhV5TJpzV6cqdA&s=09" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {/* Twitter/X Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-muted-foreground hover:text-primary"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                </a>
                <a href="https://www.instagram.com/easystaking?igsh=MXFsaThoejBsYnVkMA==" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {/* Instagram Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-muted-foreground hover:text-primary"><path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.055 1.96.24 2.416.4a4.92 4.92 0 0 1 1.78 1.17 4.92 4.92 0 0 1 1.17 1.78c.16.456.345 1.246.4 2.416.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.055 1.17-.24 1.96-.4 2.416a4.92 4.92 0 0 1-1.17 1.78 4.92 4.92 0 0 1-1.78 1.17c-.456.16-1.246.345-2.416.4-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.055-1.96-.24-2.416-.4a4.92 4.92 0 0 1-1.78-1.17 4.92 4.92 0 0 1-1.17-1.78c-.16-.456-.345-1.246-.4-2.416C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.055-1.17.24-1.96.4-2.416a4.92 4.92 0 0 1 1.17-1.78A4.92 4.92 0 0 1 5.62 2.67c.456-.16 1.246-.345 2.416-.4C8.416 2.212 8.8 2.2 12 2.2zm0 1.8c-3.173 0-3.556.012-4.813.07-1.046.05-1.613.216-1.99.36a3.12 3.12 0 0 0-1.13.74 3.12 3.12 0 0 0-.74 1.13c-.144.377-.31.944-.36 1.99-.058 1.257-.07 1.64-.07 4.813s.012 3.556.07 4.813c.05 1.046.216 1.613.36 1.99.17.441.4.814.74 1.13.33.33.689.57 1.13.74.377.144.944.31 1.99.36 1.257.058 1.64.07 4.813.07s3.556-.012 4.813-.07c1.046-.05 1.613-.216 1.99-.36a3.12 3.12 0 0 0 1.13-.74 3.12 3.12 0 0 0 .74-1.13c.144-.377.31-.944.36-1.99.058-1.257.07-1.64.07-4.813s-.012-3.556-.07-4.813c-.05-1.046-.216-1.613-.36-1.99a3.12 3.12 0 0 0-.74-1.13 3.12 3.12 0 0 0-1.13-.74c-.377-.144-.944-.31-1.99-.36-1.257-.058-1.64-.07-4.813-.07zm0 4.4a5.4 5.4 0 1 1 0 10.8 5.4 5.4 0 0 1 0-10.8zm0 1.8a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zm5.4-.9a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>
                </a>
                <a href="https://www.facebook.com/share/14Ljqk9xf7J/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {/* Facebook Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-muted-foreground hover:text-primary"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.988H7.898v-2.89h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </a>
                <a href="https://whatsapp.com/channel/0029VbBxTWRF6smqSp3SCp3d" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {/* WhatsApp Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-muted-foreground hover:text-primary"><path d="M20.52 3.48a11.85 11.85 0 0 0-16.74 0c-4.61 4.61-4.61 12.09 0 16.7l-1.92 5.6 5.8-1.92a11.85 11.85 0 0 0 16.76-16.76zm-9.06 17.22a9.4 9.4 0 1 1 9.4-9.4 9.41 9.41 0 0 1-9.4 9.4zm5.19-6.48c-.28-.14-1.65-.82-1.9-.91s-.44-.14-.62.14-.71.91-.87 1.09-.32.21-.6.07a8.2 8.2 0 0 1-2.42-1.48 9.12 9.12 0 0 1-1.68-2.07c-.17-.28 0-.43.12-.57.13-.14.28-.32.42-.48s.18-.28.28-.47a.8.8 0 0 0 .14-.45.46.46 0 0 0-.87-.32 2.61 2.61 0 0 1-.74 1.38c-.13.14-.28.32-.4.48s-.38.43-.64.64c-.26.21-.47.28-.71.43s-.57.32-.86.48a.77.77 0 0 0-.32.28 1.42 1.42 0 0 0-.27.57 4.14 4.14 0 0 0 .18 1.57c.09.26.42.43.71.64s1.48.74 1.72.82a9.62 9.62 0 0 0 3.66.61c.28 0 1.08-.11 1.56-.45.48-.36.86-.74.99-.82s.28-.14.4-.28c.12-.14.09-.26.18-.45.09-.18.04-.32-.18-.45z"/></svg>
                </a>
              </div>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              © 2025 EasyStaking - Fordwich, England. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
