import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Heart, Users, Globe, ShieldCheck, ArrowRight, Handshake, BookOpen, Utensils, Home, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROBLEMS = [
  { icon: Utensils, color: "bg-amber-100 text-amber-600", title: "Hunger", stat: "828M people", desc: "go to bed hungry every night worldwide." },
  { icon: BookOpen, color: "bg-blue-100 text-blue-600", title: "Education Gap", stat: "300M children", desc: "are out of school and denied the right to learn." },
  { icon: Home, color: "bg-orange-100 text-orange-600", title: "Displacement", stat: "110M people", desc: "forcibly displaced by conflict and climate crises." },
  { icon: Leaf, color: "bg-green-100 text-green-600", title: "Climate", stat: "3.6B people", desc: "live in areas highly vulnerable to climate change." },
];

const HOW = [
  { icon: ShieldCheck, title: "Verified NGOs", desc: "Every organization is vetted before listing, so your time and money go where they matter most." },
  { icon: Heart, title: "Track Your Impact", desc: "Your volunteer hours, donations, and badges all live in one transparent Impact Profile." },
  { icon: Globe, title: "Global & Local", desc: "Find campaigns and volunteering near you or across the world — the cause finds you." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[600px]" style={{background: "#1a0a00"}}>
        <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&q=80" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-28 md:py-40">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full mb-5">
              <Heart className="w-3.5 h-3.5 text-primary" /> The LinkedIn for Kindness
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Turn Compassion<br />into <span className="text-accent">Real Impact</span>
            </h1>
            <p className="mt-5 text-lg text-white/80 leading-relaxed max-w-xl">
              HeartsLinker connects volunteers and donors directly with verified NGOs. Track your contributions, discover causes, and build a legacy of kindness.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/Volunteering">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3 gap-2 text-base font-semibold shadow-lg">
                  Start Volunteering <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/Campaigns">
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl px-6 py-3 text-base font-semibold backdrop-blur">
                  Donate to a Campaign
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 mt-10 text-white/70 text-sm">
              <span><strong className="text-white text-xl font-bold">12,400+</strong><br />Verified Volunteers</span>
              <span><strong className="text-white text-xl font-bold">340+</strong><br />NGO Partners</span>
              <span><strong className="text-white text-xl font-bold">$2.4M+</strong><br />Raised</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">The World Needs You Now</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">The scale of suffering is enormous — but so is our collective capacity to respond.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROBLEMS.map(p => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="rounded-2xl border border-border p-6 hover:shadow-md transition-shadow">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${p.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{p.stat}</p>
                  <p className="text-sm text-muted-foreground mt-1"><strong className="text-foreground">{p.title}:</strong> {p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-secondary/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">How HeartsLinker Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW.map((h, i) => {
              const Icon = h.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-border p-7 text-center hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{h.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary via-accent to-rose-400">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Make a Difference?</h2>
          <p className="mt-4 text-white/80 text-lg">Join thousands of changemakers building a kinder world — one hour, one donation at a time.</p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link to="/NGODirectory">
              <Button className="bg-white text-primary hover:bg-white/90 rounded-xl px-7 py-3 font-semibold gap-2">
                <Handshake className="w-4 h-4" /> Browse NGOs
              </Button>
            </Link>
            <Link to="/ImpactProfile">
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 rounded-xl px-7 py-3 font-semibold">
                View My Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white/60 py-8 text-center text-sm">
        <p>© 2026 HeartsLinker · Built with ❤️ for humanity</p>
      </footer>
    </div>
  );
}