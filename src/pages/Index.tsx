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
      title: "Protected Crypto",
      description: "Your staked crypto is withdrawable at the end of the period",
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
              {
                step: "01",
                title: "Create Your Account",
                description: "Quick and secure registration in minutes",
              },
              {
                step: "02",
                title: "Fund Your Wallet",
                description: "Add funds securely",
              },
              {
                step: "03",
                title: "Choose Your Pack",
                description: "Select from 9 staking packs tailored to your budget",
              },
              {
                step: "04",
                title: "Receive Your Rewards",
                description: "Automatic weekly staking rewards for 48 weeks",
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
            Ready to Start Your Crypto Staking Journey?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join EasyStaking today and enjoy guaranteed weekly rewards
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
                <a href="https://twitter.com/easystaking" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="https://t.me/easystaking" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </a>
                <a href="https://discord.gg/easystaking" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
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
